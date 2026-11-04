interface DatabaseErrorLike {
  message?: string
  code?: string
  hint?: string | null
}

/** Converte erros do Supabase/PostgREST em mensagens amigáveis. */
export function getErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (!error || typeof error !== 'object') return fallback
  const { message, code, hint } = error as DatabaseErrorLike

  // Exceções lançadas pelas nossas funções/triggers já vêm com mensagem em português
  if (hint === 'physical_spot_locked' || code === 'P0001' || code === 'P0002') return message ?? fallback
  if (code === '23505') {
    return message?.startsWith('Já existe') ? message : 'Já existe um registro com esses dados (ex.: número de vaga repetido).'
  }
  if (code === '23514') return 'Algum valor informado é inválido.'
  if (code === '42501') return 'Você não tem permissão para esta ação.'
  return fallback
}
