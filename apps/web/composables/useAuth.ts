type AuthError = { message: string }

export interface Credentials {
  email: string
  password: string
}

/** Traduz os erros mais comuns do Supabase Auth para mensagens amigáveis. */
function translateAuthError(error: AuthError): string {
  const message = error.message.toLowerCase()
  if (message.includes('invalid login credentials')) return 'E-mail ou senha inválidos.'
  if (message.includes('already registered')) return 'Este e-mail já está cadastrado.'
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (message.includes('password')) return 'A senha não atende aos requisitos mínimos.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

/** Autenticação com Supabase Auth (e-mail e senha). */
export function useAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function signIn({ email, password }: Credentials) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(translateAuthError(error))
  }

  /** Retorna `true` se a sessão já foi iniciada (sem confirmação de e-mail pendente). */
  async function signUp({ email, password }: Credentials): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(translateAuthError(error))
    return Boolean(data.session)
  }

  async function signOut() {
    await supabase.auth.signOut()
    await navigateTo('/login')
  }

  return { user, signIn, signUp, signOut }
}
