# Arquitetura — SpotSense

## Visão geral

```
┌────────────┐  HTTP + token   ┌──────────────────────┐   UPDATE   ┌──────────────┐
│   ESP32    │ ──────────────▶ │ Supabase Edge        │ ─────────▶ │  PostgreSQL  │
│ (maquete)  │                 │ Function (valida     │            │  (tblvagas…) │
└────────────┘                 │ dispositivo e vaga)  │            └──────┬───────┘
                               └──────────────────────┘                   │ Realtime
┌────────────────────────────────────────────────────┐                    │
│ Nuxt 3 (apps/web) ◀── Supabase Auth / queries ─────┼────────────────────┘
│ dashboard, CRUD, vagas simuladas (toggle manual)   │
└────────────────────────────────────────────────────┘
```

- **Vagas simuladas:** a UI faz UPDATE direto no banco (permitido pelas policies RLS apenas para `type = 'simulated'`).
- **Vagas físicas:** só a Edge Function altera o estado, usando a `service_role` key que existe **apenas** no ambiente da função. O dispositivo se autentica com um token próprio, e o banco guarda somente o hash desse token.

## Monorepo

| Pasta | Responsabilidade |
| --- | --- |
| `apps/web` | Aplicação Nuxt 3 (frontend) |
| `packages/shared` | Tipos e constantes de domínio + tipos gerados do banco (`database.types.ts`) |
| `supabase/migrations` | Schema SQL versionado (tabelas `tbl*`, índices, RLS, triggers) |
| `supabase/functions` | Edge Functions (Deno). `_shared/` guarda o código comum entre funções |
| `firmware/esp32` | Firmware PlatformIO do ESP32 |
| `docs` | Documentação do projeto |

## Camadas do app Nuxt (`apps/web`)

| Pasta | O que vai aqui |
| --- | --- |
| `pages/` | Rotas. Só orquestram: buscam dados via composables e montam componentes |
| `layouts/` | `default` (sidebar + header glass) e `auth` (telas de login) |
| `components/layout/` | Estrutura da aplicação: `AppSidebar`, `AppHeader`, `AppLogo`, `ThemeToggle` |
| `components/dashboard/` | Cards de métricas e indicadores de ocupação |
| `components/parking-lots/` | Formulários, tabelas e cards de estacionamentos |
| `components/spots/` | Grade de vagas, card de vaga, badges de tipo e status |
| `components/common/` | Componentes genéricos reutilizáveis (estados vazios, loaders etc.) |
| `composables/` | Estado e lógica reativa (`useParkingLots`, `useSpots`, `useSpotsRealtime`…) |
| `services/` | Acesso ao Supabase (queries puras e tipadas, sem estado de UI) |
| `types/` | Tipos exclusivos do frontend (os de domínio ficam em `@spotsense/shared`) |
| `utils/` | Funções puras e constantes (ex.: `navigation.ts`) |
| `middleware/` | Middlewares de rota (a autenticação já vem do módulo `@nuxtjs/supabase`) |
| `plugins/` | Plugins Nuxt |
| `assets/css/main.css` | Design system: tokens `--ss-*`, escala `neon` e utilitários `glass` |

Fluxo de dependência: `pages → components → composables → services → Supabase`.

Os componentes são registrados sem prefixo de pasta (`pathPrefix: false`), então `components/layout/AppHeader.vue` é usado como `<AppHeader />`.

## Design system

- Tokens em `apps/web/assets/css/main.css`: `--ss-bg`, `--ss-text`, `--ss-accent`, `--ss-glass-*`, `--ss-radius-*`.
- Tema único escuro: a classe `dark` é fixa no `<html>` (`nuxt.config.ts`) e o color-mode do Nuxt UI está desativado, então não há script de troca nem flash.
- O Nuxt UI usa a escala `neon` como `primary`; botões e campos têm 6px de arredondamento (`--ui-radius`).
- Utilitários Tailwind: `glass` (superfícies padrão) e `glass-strong` (modais e menus).
