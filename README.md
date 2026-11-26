<div align="center">

# SpotSense

**Estacionamento inteligente: um sensor real mostra, em tempo real, se a vaga está livre ou ocupada.**

Nuxt 3 · Supabase · ESP32 · HC-SR04

</div>

---

## O que é

Uma plataforma web para cadastrar estacionamentos e acompanhar suas vagas ao vivo.
Existem dois tipos de vaga:

| Tipo | Quem muda o estado | Exemplo |
| --- | --- | --- |
| **Simulada** | O usuário, clicando na tela | As vagas "de mentira" da demonstração |
| **Física** | Somente o sensor (ESP32) | A vaga real da maquete |

> Vaga física **nunca** muda pela tela. Isso é garantido no banco de dados, não só no visual.

## Como funciona (em 1 minuto)

```
Sensor ──▶ ESP32 ──Wi-Fi──▶ Edge Function ──▶ Banco ──Realtime──▶ Site
mede a      decide:          confere o         grava a    avisa      o mapa muda
distância   livre/ocupada    token             situação   o site     sozinho
```

1. O **sensor ultrassônico** mede a distância até o chão da vaga.
2. O **ESP32** compara com a vaga vazia: se algo chegou perto, está **ocupada**.
3. Quando o estado muda, ele envia `{"situacao":"ocupada"}` + um token ao servidor.
4. O servidor valida o token, grava no banco, e o **Realtime** atualiza o site na hora.

## Dois modos de uso

| | **Nuvem** (apresentação) | **Local** (sem internet, plano B) |
| --- | --- | --- |
| Site | GitHub Pages | `pnpm dev` no notebook |
| Banco e função | Supabase na nuvem | Supabase no Docker |
| ESP32 envia para | `https://<projeto>.supabase.co/...` | `http://<IP do notebook>:54321/...` |

Site publicado: https://klebersonclima.github.io/SpotSense/

## Rodar localmente

Requisitos: Node 22+, pnpm 11+, Docker.

```bash
pnpm install
pnpm db:start                                  # sobe o Supabase local
cp apps/web/.env.example apps/web/.env         # preencha URL e chave (saem do comando acima)
pnpm dev                                       # http://localhost:3000
```

Comandos úteis: `pnpm lint`, `pnpm typecheck`, `pnpm db:reset` (recria o banco), `pnpm db:types`.

## Onde está cada coisa

```
SpotSense/
├── apps/web/            Site (Nuxt 3): páginas, componentes, composables, services
├── packages/shared/     Tipos compartilhados (inclui os gerados do banco)
├── supabase/
│   ├── migrations/      Tabelas, regras e segurança do banco (SQL)
│   └── functions/       Edge Function que recebe os dados do ESP32
├── firmware/
│   ├── comum/           Lógica do sensor (medir, filtrar, calibrar)
│   ├── esp32/           Firmware definitivo (Wi-Fi + envio)
│   ├── uno/ e ponte/    Protótipo com Arduino UNO (sem Wi-Fi)
├── docs/                Documentação (veja abaixo)
└── .github/workflows/   Publicação automática no GitHub Pages
```

## Documentação

| Documento | Para quê |
| --- | --- |
| [**Guia de apresentação**](docs/guia-de-apresentacao.md) | **Comece por aqui.** Explica tudo: lógica, conexões, decisões e como apresentar |
| [Firmware](firmware/README.md) | Ligar o sensor, configurar e gravar o ESP32 |
| [Arquitetura](docs/arquitetura.md) | Camadas e pastas do projeto |
| [Contexto](docs/contexto.md) | Objetivos, regras de negócio e identidade visual |

## Segurança

- O site usa só a chave **pública** do Supabase, protegida por regras de acesso (RLS).
- A chave administrativa (`service_role`) existe apenas dentro da Edge Function. Nunca no site nem no ESP32.
- Cada dispositivo tem um token próprio; o banco guarda só o **hash**.

## Licença

[MIT](LICENSE) © Kleberson Lima
