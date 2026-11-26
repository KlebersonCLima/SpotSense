import { fileURLToPath } from 'node:url'

// Dois modos de uso (o padrão é o modo LOCAL, que funciona sem internet):
//  - Local: `pnpm dev`, sem nenhuma variável extra.
//  - GitHub Pages (site estático): o workflow define NUXT_SSR=false, NITRO_PRESET=github_pages
//    e NUXT_APP_BASE_URL=/SpotSense/ (veja .github/workflows/pages.yml).
const baseUrl = process.env.NUXT_APP_BASE_URL || '/'
const modoEstatico = process.env.NUXT_SSR === 'false'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },

  // Site estático (GitHub Pages) não tem servidor: o app roda só no navegador (SPA).
  ssr: !modoEstatico,

  runtimeConfig: {
    public: { modoEstatico },
  },

  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  // Componentes referenciados pelo nome do arquivo, sem prefixo da pasta
  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    baseURL: baseUrl,
    head: {
      // Aplicação somente no tema escuro (classe fixa, sem script de troca e sem flash)
      htmlAttrs: { lang: 'pt-BR', class: 'dark' },
      title: 'SpotSense',
      meta: [
        { name: 'description', content: 'Gerenciamento inteligente de estacionamentos com IoT.' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: `${baseUrl}favicon.svg` }],
    },
  },

  // Tema único (escuro): desativa o módulo de alternância de cor do Nuxt UI
  ui: {
    colorMode: false,
  },

  // Usa NUXT_PUBLIC_SUPABASE_URL e NUXT_PUBLIC_SUPABASE_KEY (chave pública) do .env
  supabase: {
    // No modo estático a proteção das rotas é feita em middleware/autenticacao.global.ts
    redirect: !modoEstatico,
    types: fileURLToPath(new URL('../../packages/shared/src/database.types.ts', import.meta.url)),
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: [],
    },
  },

  typescript: {
    strict: true,
  },
})
