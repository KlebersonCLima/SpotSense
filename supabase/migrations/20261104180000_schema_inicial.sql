-- =============================================================================
-- SpotSense — schema inicial
-- Padrão de nomes: tabelas com prefixo "tbl" + nome em português, sem "_".
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Funções utilitárias
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- tblestacionamentos
-- -----------------------------------------------------------------------------

create table public.tblestacionamentos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 2 and 120),
  description text check (char_length(description) <= 500),
  address     text check (char_length(address) <= 255),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.tblestacionamentos is 'Estacionamentos cadastrados por cada usuário.';

create index tblestacionamentos_owner_id_idx on public.tblestacionamentos (owner_id);

create trigger tblestacionamentos_set_updated_at
  before update on public.tblestacionamentos
  for each row execute function public.set_updated_at();

-- Verifica se o usuário autenticado é dono do estacionamento (usado nas policies)
create or replace function public.is_parking_lot_owner(p_parking_lot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tblestacionamentos
    where id = p_parking_lot_id
      and owner_id = (select auth.uid())
  );
$$;

-- -----------------------------------------------------------------------------
-- tblvagas
-- -----------------------------------------------------------------------------

create table public.tblvagas (
  id              uuid primary key default gen_random_uuid(),
  parking_lot_id  uuid not null references public.tblestacionamentos (id) on delete cascade,
  spot_number     integer not null check (spot_number between 1 and 9999),
  type            text not null default 'simulated' check (type in ('simulated', 'physical')),
  status          text not null default 'available' check (status in ('available', 'occupied')),
  last_updated_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint tblvagas_lot_number_key unique (parking_lot_id, spot_number)
);

comment on table public.tblvagas is 'Vagas de cada estacionamento. Vagas físicas só mudam de estado pelo IoT.';
comment on column public.tblvagas.type is 'simulated: controle manual pela interface | physical: controle exclusivo do dispositivo IoT';

-- Regra fundamental: vaga física não pode ter o estado alterado manualmente.
-- Somente a Edge Function (service_role) ou um administrador do banco podem alterar.
create or replace function public.tblvagas_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if old.type = 'physical' and current_user not in ('service_role', 'postgres') then
      raise exception 'Vagas físicas só podem ter o estado alterado pelo dispositivo IoT.'
        using errcode = 'P0001', hint = 'physical_spot_locked';
    end if;
    new.last_updated_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger tblvagas_before_update
  before update on public.tblvagas
  for each row execute function public.tblvagas_before_update();

-- -----------------------------------------------------------------------------
-- tbldispositivosiot
-- -----------------------------------------------------------------------------

create table public.tbldispositivosiot (
  id                uuid primary key default gen_random_uuid(),
  parking_spot_id   uuid not null unique references public.tblvagas (id) on delete cascade,
  device_identifier text not null unique check (device_identifier ~ '^[A-Za-z0-9_-]{3,64}$'),
  device_token_hash text not null,
  last_seen_at      timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.tbldispositivosiot is 'Dispositivos ESP32 vinculados a vagas físicas. Guarda apenas o hash SHA-256 do token.';

create trigger tbldispositivosiot_set_updated_at
  before update on public.tbldispositivosiot
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- tblhistoricovagas
-- -----------------------------------------------------------------------------

create table public.tblhistoricovagas (
  id              bigint generated always as identity primary key,
  parking_spot_id uuid not null references public.tblvagas (id) on delete cascade,
  previous_status text check (previous_status in ('available', 'occupied')),
  new_status      text not null check (new_status in ('available', 'occupied')),
  source          text not null check (source in ('manual', 'iot')),
  changed_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table public.tblhistoricovagas is 'Histórico de mudanças de estado das vagas e a origem da alteração.';

create index tblhistoricovagas_spot_created_idx
  on public.tblhistoricovagas (parking_spot_id, created_at desc);

create or replace function public.tblvagas_log_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tblhistoricovagas (parking_spot_id, previous_status, new_status, source, changed_by)
  values (
    new.id,
    old.status,
    new.status,
    case when (select auth.role()) = 'service_role' then 'iot' else 'manual' end,
    (select auth.uid())
  );
  return null;
end;
$$;

create trigger tblvagas_log_status
  after update of status on public.tblvagas
  for each row
  when (old.status is distinct from new.status)
  execute function public.tblvagas_log_status();

-- -----------------------------------------------------------------------------
-- Cadastro de dispositivo IoT (gera token e salva somente o hash)
-- -----------------------------------------------------------------------------

create or replace function public.register_iot_device(p_parking_spot_id uuid, p_device_identifier text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parking_lot_id uuid;
  v_type text;
  v_token text;
  v_device_id uuid;
begin
  select parking_lot_id, type
    into v_parking_lot_id, v_type
  from public.tblvagas
  where id = p_parking_spot_id;

  if v_parking_lot_id is null or not public.is_parking_lot_owner(v_parking_lot_id) then
    raise exception 'Vaga não encontrada.' using errcode = 'P0002';
  end if;

  if v_type <> 'physical' then
    raise exception 'Somente vagas físicas podem ter um dispositivo IoT.' using errcode = 'P0001';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.tbldispositivosiot (parking_spot_id, device_identifier, device_token_hash)
  values (p_parking_spot_id, btrim(p_device_identifier), encode(extensions.digest(v_token, 'sha256'), 'hex'))
  on conflict (parking_spot_id) do update
    set device_identifier = excluded.device_identifier,
        device_token_hash = excluded.device_token_hash,
        is_active = true
  returning id into v_device_id;

  return json_build_object(
    'device_id', v_device_id,
    'device_identifier', btrim(p_device_identifier),
    'device_token', v_token
  );
exception
  when unique_violation then
    raise exception 'Já existe um dispositivo com este identificador.' using errcode = '23505';
end;
$$;

revoke execute on function public.register_iot_device(uuid, text) from public, anon;
grant execute on function public.register_iot_device(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.tblestacionamentos enable row level security;
alter table public.tblvagas enable row level security;
alter table public.tbldispositivosiot enable row level security;
alter table public.tblhistoricovagas enable row level security;

-- tblestacionamentos: cada usuário gerencia apenas os próprios
create policy "Donos leem seus estacionamentos" on public.tblestacionamentos
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Donos criam estacionamentos" on public.tblestacionamentos
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Donos editam seus estacionamentos" on public.tblestacionamentos
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Donos excluem seus estacionamentos" on public.tblestacionamentos
  for delete to authenticated using (owner_id = (select auth.uid()));

-- tblvagas: acesso pelo dono do estacionamento
create policy "Donos leem vagas" on public.tblvagas
  for select to authenticated using (public.is_parking_lot_owner(parking_lot_id));
create policy "Donos criam vagas" on public.tblvagas
  for insert to authenticated with check (public.is_parking_lot_owner(parking_lot_id));
create policy "Donos editam vagas" on public.tblvagas
  for update to authenticated
  using (public.is_parking_lot_owner(parking_lot_id))
  with check (public.is_parking_lot_owner(parking_lot_id));
create policy "Donos excluem vagas" on public.tblvagas
  for delete to authenticated using (public.is_parking_lot_owner(parking_lot_id));

-- tbldispositivosiot: leitura, ativação e exclusão pelo dono; criação só via register_iot_device
create policy "Donos leem dispositivos" on public.tbldispositivosiot
  for select to authenticated
  using (public.is_parking_lot_owner((select v.parking_lot_id from public.tblvagas v where v.id = parking_spot_id)));
create policy "Donos editam dispositivos" on public.tbldispositivosiot
  for update to authenticated
  using (public.is_parking_lot_owner((select v.parking_lot_id from public.tblvagas v where v.id = parking_spot_id)));
create policy "Donos excluem dispositivos" on public.tbldispositivosiot
  for delete to authenticated
  using (public.is_parking_lot_owner((select v.parking_lot_id from public.tblvagas v where v.id = parking_spot_id)));

-- O hash do token nunca é exposto ao frontend
revoke select, insert, update on public.tbldispositivosiot from anon, authenticated;
grant select (id, parking_spot_id, device_identifier, last_seen_at, is_active, created_at, updated_at)
  on public.tbldispositivosiot to authenticated;
grant update (is_active) on public.tbldispositivosiot to authenticated;

-- tblhistoricovagas: somente leitura pelo dono (escrita via trigger)
create policy "Donos leem histórico" on public.tblhistoricovagas
  for select to authenticated
  using (public.is_parking_lot_owner((select v.parking_lot_id from public.tblvagas v where v.id = parking_spot_id)));

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.tblvagas;
alter publication supabase_realtime add table public.tblestacionamentos;
