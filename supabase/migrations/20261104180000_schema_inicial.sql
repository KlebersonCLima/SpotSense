-- =============================================================================
-- SpotSense — schema inicial (tudo em português)
-- Padrão de nomes: tabelas com prefixo "tbl" + nome, sem "_".
-- Vagas: tipo = 'simulada' | 'fisica'   situacao = 'livre' | 'ocupada'
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Funções utilitárias
-- -----------------------------------------------------------------------------

create or replace function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- tblestacionamentos
-- -----------------------------------------------------------------------------

create table public.tblestacionamentos (
  id            uuid primary key default gen_random_uuid(),
  dono_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome          text not null check (char_length(btrim(nome)) between 2 and 120),
  descricao     text check (char_length(descricao) <= 500),
  endereco      text check (char_length(endereco) <= 255),
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.tblestacionamentos is 'Estacionamentos cadastrados por cada usuário.';

create index tblestacionamentos_dono_id_idx on public.tblestacionamentos (dono_id);

create trigger tblestacionamentos_atualizado_em
  before update on public.tblestacionamentos
  for each row execute function public.definir_atualizado_em();

-- Verifica se o usuário autenticado é dono do estacionamento (usado nas policies)
create or replace function public.eh_dono_estacionamento(p_estacionamento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tblestacionamentos
    where id = p_estacionamento_id
      and dono_id = (select auth.uid())
  );
$$;

-- -----------------------------------------------------------------------------
-- tblvagas
-- -----------------------------------------------------------------------------

create table public.tblvagas (
  id                       uuid primary key default gen_random_uuid(),
  estacionamento_id        uuid not null references public.tblestacionamentos (id) on delete cascade,
  numero                   integer not null check (numero between 1 and 9999),
  tipo                     text not null default 'simulada' check (tipo in ('simulada', 'fisica')),
  situacao                 text not null default 'livre' check (situacao in ('livre', 'ocupada')),
  situacao_atualizada_em   timestamptz not null default now(),
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now(),
  constraint tblvagas_estacionamento_numero_key unique (estacionamento_id, numero)
);

comment on table public.tblvagas is 'Vagas de cada estacionamento. Vagas físicas só mudam de situação pelo dispositivo IoT.';
comment on column public.tblvagas.tipo is 'simulada: controle manual pela interface | fisica: controle exclusivo do dispositivo IoT';

-- Regra fundamental: vaga física não pode ter a situação alterada manualmente.
-- Somente a Edge Function (service_role) ou um administrador do banco podem alterar.
create or replace function public.tblvagas_antes_de_atualizar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.situacao is distinct from old.situacao then
    if old.tipo = 'fisica' and current_user not in ('service_role', 'postgres') then
      raise exception 'Vagas físicas só podem ter a situação alterada pelo dispositivo IoT.'
        using errcode = 'P0001', hint = 'vaga_fisica_bloqueada';
    end if;
    new.situacao_atualizada_em = now();
  end if;
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger tblvagas_antes_de_atualizar
  before update on public.tblvagas
  for each row execute function public.tblvagas_antes_de_atualizar();

-- -----------------------------------------------------------------------------
-- tbldispositivosiot
-- -----------------------------------------------------------------------------

create table public.tbldispositivosiot (
  id                 uuid primary key default gen_random_uuid(),
  vaga_id            uuid not null unique references public.tblvagas (id) on delete cascade,
  identificador      text not null unique check (identificador ~ '^[A-Za-z0-9_-]{3,64}$'),
  token_hash         text not null,
  ultimo_contato_em  timestamptz,
  ativo              boolean not null default true,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

comment on table public.tbldispositivosiot is 'Dispositivos ESP32 vinculados a vagas físicas. Guarda apenas o hash SHA-256 do token.';

create trigger tbldispositivosiot_atualizado_em
  before update on public.tbldispositivosiot
  for each row execute function public.definir_atualizado_em();

-- -----------------------------------------------------------------------------
-- tblhistoricovagas
-- -----------------------------------------------------------------------------

create table public.tblhistoricovagas (
  id                bigint generated always as identity primary key,
  vaga_id           uuid not null references public.tblvagas (id) on delete cascade,
  situacao_anterior text check (situacao_anterior in ('livre', 'ocupada')),
  situacao_nova     text not null check (situacao_nova in ('livre', 'ocupada')),
  origem            text not null check (origem in ('manual', 'sensor')),
  alterado_por      uuid references auth.users (id) on delete set null,
  criado_em         timestamptz not null default now()
);

comment on table public.tblhistoricovagas is 'Histórico de mudanças de situação das vagas e a origem da alteração.';

create index tblhistoricovagas_vaga_criado_idx
  on public.tblhistoricovagas (vaga_id, criado_em desc);

create or replace function public.tblvagas_registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.tblhistoricovagas (vaga_id, situacao_anterior, situacao_nova, origem, alterado_por)
  values (
    new.id,
    old.situacao,
    new.situacao,
    case when (select auth.role()) = 'service_role' then 'sensor' else 'manual' end,
    (select auth.uid())
  );
  return null;
end;
$$;

create trigger tblvagas_registrar_historico
  after update of situacao on public.tblvagas
  for each row
  when (old.situacao is distinct from new.situacao)
  execute function public.tblvagas_registrar_historico();

-- -----------------------------------------------------------------------------
-- Cadastro de dispositivo IoT (gera token e salva somente o hash)
-- -----------------------------------------------------------------------------

create or replace function public.registrar_dispositivo_iot(p_vaga_id uuid, p_identificador text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estacionamento_id uuid;
  v_tipo text;
  v_token text;
  v_dispositivo_id uuid;
begin
  select estacionamento_id, tipo
    into v_estacionamento_id, v_tipo
  from public.tblvagas
  where id = p_vaga_id;

  if v_estacionamento_id is null or not public.eh_dono_estacionamento(v_estacionamento_id) then
    raise exception 'Vaga não encontrada.' using errcode = 'P0002';
  end if;

  if v_tipo <> 'fisica' then
    raise exception 'Somente vagas físicas podem ter um dispositivo IoT.' using errcode = 'P0001';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.tbldispositivosiot (vaga_id, identificador, token_hash)
  values (p_vaga_id, btrim(p_identificador), encode(extensions.digest(v_token, 'sha256'), 'hex'))
  on conflict (vaga_id) do update
    set identificador = excluded.identificador,
        token_hash = excluded.token_hash,
        ativo = true
  returning id into v_dispositivo_id;

  return json_build_object(
    'dispositivo_id', v_dispositivo_id,
    'identificador', btrim(p_identificador),
    'token', v_token
  );
exception
  when unique_violation then
    raise exception 'Já existe um dispositivo com este identificador.' using errcode = '23505';
end;
$$;

revoke execute on function public.registrar_dispositivo_iot(uuid, text) from public, anon;
grant execute on function public.registrar_dispositivo_iot(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.tblestacionamentos enable row level security;
alter table public.tblvagas enable row level security;
alter table public.tbldispositivosiot enable row level security;
alter table public.tblhistoricovagas enable row level security;

-- tblestacionamentos: cada usuário gerencia apenas os próprios
create policy "Donos leem seus estacionamentos" on public.tblestacionamentos
  for select to authenticated using (dono_id = (select auth.uid()));
create policy "Donos criam estacionamentos" on public.tblestacionamentos
  for insert to authenticated with check (dono_id = (select auth.uid()));
create policy "Donos editam seus estacionamentos" on public.tblestacionamentos
  for update to authenticated using (dono_id = (select auth.uid())) with check (dono_id = (select auth.uid()));
create policy "Donos excluem seus estacionamentos" on public.tblestacionamentos
  for delete to authenticated using (dono_id = (select auth.uid()));

-- tblvagas: acesso pelo dono do estacionamento
create policy "Donos leem vagas" on public.tblvagas
  for select to authenticated using (public.eh_dono_estacionamento(estacionamento_id));
create policy "Donos criam vagas" on public.tblvagas
  for insert to authenticated with check (public.eh_dono_estacionamento(estacionamento_id));
create policy "Donos editam vagas" on public.tblvagas
  for update to authenticated
  using (public.eh_dono_estacionamento(estacionamento_id))
  with check (public.eh_dono_estacionamento(estacionamento_id));
create policy "Donos excluem vagas" on public.tblvagas
  for delete to authenticated using (public.eh_dono_estacionamento(estacionamento_id));

-- tbldispositivosiot: leitura, ativação e exclusão pelo dono; criação só via registrar_dispositivo_iot
create policy "Donos leem dispositivos" on public.tbldispositivosiot
  for select to authenticated
  using (public.eh_dono_estacionamento((select v.estacionamento_id from public.tblvagas v where v.id = vaga_id)));
create policy "Donos editam dispositivos" on public.tbldispositivosiot
  for update to authenticated
  using (public.eh_dono_estacionamento((select v.estacionamento_id from public.tblvagas v where v.id = vaga_id)));
create policy "Donos excluem dispositivos" on public.tbldispositivosiot
  for delete to authenticated
  using (public.eh_dono_estacionamento((select v.estacionamento_id from public.tblvagas v where v.id = vaga_id)));

-- O hash do token nunca é exposto ao frontend
revoke select, insert, update on public.tbldispositivosiot from anon, authenticated;
grant select (id, vaga_id, identificador, ultimo_contato_em, ativo, criado_em, atualizado_em)
  on public.tbldispositivosiot to authenticated;
grant update (ativo) on public.tbldispositivosiot to authenticated;

-- tblhistoricovagas: somente leitura pelo dono (escrita via trigger)
create policy "Donos leem histórico" on public.tblhistoricovagas
  for select to authenticated
  using (public.eh_dono_estacionamento((select v.estacionamento_id from public.tblvagas v where v.id = vaga_id)));

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.tblvagas;
alter publication supabase_realtime add table public.tblestacionamentos;
