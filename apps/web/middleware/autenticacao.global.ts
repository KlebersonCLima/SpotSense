// Proteção de rotas do modo ESTÁTICO (GitHub Pages).
//
// No modo local (SSR) quem redireciona é o módulo @nuxtjs/supabase. No site estático
// esse redirecionamento é desligado, porque durante o build não existe sessão e ele
// transformaria todas as páginas em "Redirecting...". Aqui a checagem roda só no navegador.

const ROTAS_PUBLICAS = ['/login', '/confirm']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { modoEstatico } = useRuntimeConfig().public
  if (!modoEstatico) return

  if (ROTAS_PUBLICAS.includes(to.path)) return

  const sessao = useSupabaseSession()
  if (!sessao.value) {
    return navigateTo('/login')
  }
})
