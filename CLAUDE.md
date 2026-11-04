# CLAUDE.md — Regras do projeto SpotSense

Contexto completo do produto: [docs/contexto.md](docs/contexto.md). Arquitetura: [docs/arquitetura.md](docs/arquitetura.md).

## Regras obrigatórias

### Git
- **Nenhum commit ou push pode ter créditos ao Claude/IA.** Proibido `Co-Authored-By: Claude`, "Generated with Claude Code", "by Claude" ou qualquer atribuição semelhante em mensagens de commit, descrições de PR ou arquivos.
- Se algum commit tiver esse tipo de crédito, ele deve ser reescrito para remover a atribuição.
- Só fazer commit ou push quando o desenvolvedor pedir explicitamente.

### Banco de dados — nomenclatura
- Toda tabela usa o prefixo `tbl` seguido do nome em português, **tudo junto, sem `_`**, mesmo quando o nome é composto.
  - Exemplos: `tblvagas`, `tblestacionamentos`, `tblvagasestacionamento`, `tbldispositivosiot`, `tblhistoricovagas`.
- Os nomes conceituais do documento de contexto (`parking_lots`, `parking_spots`, `iot_devices`) devem ser traduzidos para esse padrão.

### Stack (não substituir sem necessidade técnica real)
- Nuxt 3 + TypeScript, Nuxt UI **v3** (a v4 exige Nuxt 4) + Tailwind CSS v4.
- Supabase: PostgreSQL, Auth, Realtime e Edge Functions. Sem backend separado (nada de NestJS).
- ESP32 com PlatformIO (framework Arduino), comunicação via HTTP com uma Edge Function.
- Gerenciador de pacotes: **pnpm** (workspaces).

### Regras de negócio críticas
- Vaga **física** nunca tem o estado alterado manualmente pela interface; só o dispositivo IoT, via Edge Function, altera esse estado. Garantir isso também no banco (RLS/policies), não só na UI.
- Vaga **simulada** é alternada manualmente pela interface.
- Nunca expor a `service_role` key no frontend nem no firmware.

### Identidade visual
- Paleta: `#101010`, `#FFFFFF`, `#C8FF00` (destaque). Nenhuma outra cor dominante.
- Glassmorphism com os tokens de `apps/web/assets/css/main.css` (`--ss-*`, utilitários `glass` e `glass-strong`). Não usar cores soltas nos componentes.
- Temas claro e escuro via `useColorMode()` do Nuxt UI (persistência e preferência do SO já configuradas).

## Comandos
- `pnpm dev`: app web.
- `pnpm typecheck` / `pnpm lint`: rodar antes de concluir qualquer tarefa.
- `pnpm db:start` / `pnpm db:reset` / `pnpm db:types`: Supabase local (requer Docker).
