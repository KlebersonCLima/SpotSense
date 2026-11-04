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
      htmlAttrs: { lang: 'pt-BR' },
      title: 'SpotSense',
      meta: [
        { name: 'description', content: 'Gerenciamento inteligente de estacionamentos com IoT.' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  // Tema claro/escuro: segue o SO, persiste a escolha e evita flash na inicialização
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    storageKey: 'spotsense-color-mode',
  },

  // Usa SUPABASE_URL e SUPABASE_KEY (chave pública/anon) do .env
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
