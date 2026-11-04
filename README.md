<div align="center">

# SpotSense

**Plataforma inteligente de gerenciamento de estacionamentos com integração IoT.**

Nuxt 3 · TypeScript · Nuxt UI · Tailwind CSS · Supabase · ESP32

</div>

---

## Sobre

O SpotSense permite cadastrar estacionamentos, gerenciar suas vagas e acompanhar **em tempo real** quais estão ocupadas ou disponíveis.

O diferencial é combinar dois tipos de vaga:

| Tipo | Quem controla o estado | Uso |
| --- | --- | --- |
| **Simulada** | O usuário, pela interface | Representa as demais vagas na demonstração |
| **Física** | Somente o sensor + ESP32 | Vaga real da maquete, atualizada automaticamente |

> Uma vaga física **nunca** pode ter o estado alterado manualmente pela interface.

O projeto é acadêmico e será apresentado com uma maquete física de estacionamento contendo uma vaga real monitorada por sensor e ESP32.

## Arquitetura

```
Sensor ─▶ ESP32 ─HTTP─▶ Supabase Edge Function ─▶ PostgreSQL ─Realtime─▶ Nuxt (dashboard)
```

1. O sensor detecta presença ou ausência de veículo.
2. O ESP32 envia o estado via HTTP para uma **Edge Function**, autenticando-se com um token próprio.
3. A função valida o dispositivo e a vaga e atualiza o banco.
4. O **Supabase Realtime** propaga a mudança e a interface atualiza na hora.

Detalhes em [docs/arquitetura.md](docs/arquitetura.md).

## Estrutura do monorepo

```
SpotSense/
├── apps/
│   └── web/                  # Aplicação Nuxt 3
│       ├── assets/css/       # Design system (tokens, glassmorphism)
│       ├── components/
│       │   ├── layout/       # Sidebar, header, logo, alternância de tema
│       │   ├── dashboard/    # Métricas e indicadores
│       │   ├── parking-lots/ # Estacionamentos
│       │   ├── spots/        # Vagas
│       │   └── common/       # Componentes genéricos
│       ├── composables/      # Estado e lógica reativa
│       ├── services/         # Acesso ao Supabase
│       ├── layouts/          # default (dashboard) e auth
│       ├── pages/            # Rotas
│       ├── middleware/
│       ├── plugins/
│       ├── types/
│       └── utils/
├── packages/
│   └── shared/               # Tipos de domínio + tipos gerados do banco
├── supabase/
│   ├── migrations/           # Schema SQL versionado
│   ├── functions/            # Edge Functions (Deno)
│   ├── config.toml
│   └── seed.sql
├── firmware/
│   └── esp32/                # Firmware do ESP32 (PlatformIO)
├── docs/                     # Contexto e arquitetura
├── CLAUDE.md                 # Regras do projeto para assistentes de IA
└── package.json              # Scripts do workspace (pnpm)
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 22+ (veja `.nvmrc`)
- [pnpm](https://pnpm.io/) 11+
- [Docker](https://www.docker.com/) (para rodar o Supabase localmente)
- [VS Code](https://code.visualstudio.com/) com a extensão [PlatformIO](https://platformio.org/) (para o firmware)

## Como rodar

```bash
# 1. Instalar dependências
pnpm install

# 2. Subir o Supabase local (requer Docker)
pnpm db:start

# 3. Configurar variáveis de ambiente do app
cp apps/web/.env.example apps/web/.env
#   preencha NUXT_PUBLIC_SUPABASE_URL e NUXT_PUBLIC_SUPABASE_KEY
#   (valores exibidos pelo comando anterior; use a chave anon/publishable)

# 4. Iniciar o app
pnpm dev
```

O app fica disponível em http://localhost:3000.

## Scripts

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia o app Nuxt em modo desenvolvimento |
| `pnpm build` | Gera o build de produção |
| `pnpm preview` | Pré-visualiza o build |
| `pnpm lint` | Executa o ESLint |
| `pnpm typecheck` | Verifica os tipos TypeScript |
| `pnpm db:start` / `db:stop` | Sobe/derruba o Supabase local |
| `pnpm db:reset` | Recria o banco local aplicando migrations e seed |
| `pnpm db:types` | Gera `packages/shared/src/database.types.ts` a partir do banco |
| `pnpm functions:serve` | Executa as Edge Functions localmente |

## Integração IoT

1. No painel do estacionamento, aba **Gerenciar vagas**, defina a vaga como **Física (IoT)** e clique em **Vincular dispositivo**.
2. Copie o endpoint, o identificador e o token. O token só é exibido uma vez.
3. Rode as Edge Functions localmente com `pnpm functions:serve`.

O ESP32 envia o estado da vaga assim (dá para simular com `curl`, sem a placa):

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/iot-spot-status \
  -H "x-device-id: esp32-vaga-50" \
  -H "x-device-token: <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"occupied"}'   # ou "available"
```

| Resposta | Significado |
| --- | --- |
| `200 { ok, spot_number, status, changed }` | Estado registrado |
| `400 invalid_status` / `invalid_json` | Corpo inválido |
| `401 unauthorized` / `missing_credentials` | Identificador ou token incorretos |
| `403 device_inactive` | Dispositivo desativado no painel |
| `409 spot_not_physical` | A vaga vinculada não é física |

O mapa atualiza em tempo real e a mudança aparece no feed de atividade como **Sensor IoT**.

## Firmware (ESP32)

Veja [firmware/esp32/README.md](firmware/esp32/README.md).

## Banco de dados

Padrão de nomenclatura: tabelas com prefixo **`tbl`** + nome em português, **sem `_`**.

| Tabela | Descrição |
| --- | --- |
| `tblestacionamentos` | Estacionamentos cadastrados |
| `tblvagas` | Vagas de cada estacionamento (tipo e status) |
| `tbldispositivosiot` | Dispositivos ESP32 vinculados às vagas físicas |
| `tblhistoricovagas` | Histórico de mudanças de estado das vagas |

## Identidade visual

| Cor | Uso |
| --- | --- |
| `#101010` | Preto profundo: fundo da aplicação |
| `#FFFFFF` | Branco: textos |
| `#C8FF00` | Verde-limão neon: destaques e elementos interativos |

Interface em **Glassmorphism**, somente no **tema escuro**. Os tokens ficam em [apps/web/assets/css/main.css](apps/web/assets/css/main.css).

## Segurança

- O frontend usa apenas a chave **pública** (anon/publishable) do Supabase, protegida por RLS.
- A `service_role` key existe somente no ambiente das Edge Functions, nunca no frontend nem no ESP32.
- Cada dispositivo IoT tem um token próprio, e o banco armazena apenas o hash.

## Documentação

- [Contexto do projeto](docs/contexto.md): objetivos, regras de negócio e identidade visual
- [Arquitetura](docs/arquitetura.md): camadas, pastas e fluxo de dados

## Licença

[MIT](LICENSE) © Kleberson Lima
