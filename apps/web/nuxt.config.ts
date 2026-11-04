import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  // Componentes referenciados pelo nome do arquivo, sem prefixo da pasta
  components: [{ path: '~/components', pathPrefix: false }],

  app: {
    head: {
      // Aplicação somente no tema escuro (classe fixa, sem script de troca e sem flash)
      htmlAttrs: { lang: 'pt-BR', class: 'dark' },
      title: 'SpotSense',
      meta: [
        { name: 'description', content: 'Gerenciamento inteligente de estacionamentos com IoT.' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  // Tema único (escuro): desativa o módulo de alternância de cor do Nuxt UI
  ui: {
    colorMode: false,
  },

  // Usa NUXT_PUBLIC_SUPABASE_URL e NUXT_PUBLIC_SUPABASE_KEY (chave pública) do .env
  supabase: {
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
