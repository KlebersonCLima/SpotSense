// SpotSense — recebe a situação de uma vaga física enviada pelo ESP32.
//
// POST /functions/v1/iot-situacao-vaga
// Headers: x-dispositivo-id: <identificador>   x-dispositivo-token: <token do dispositivo>
// Body:    { "situacao": "ocupada" | "livre" }
//
// A autenticação é feita pelo token do dispositivo (o banco guarda apenas o hash SHA-256).
// A service_role key existe somente aqui, no ambiente da função.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SITUACOES_VALIDAS = ['livre', 'ocupada'] as const
type Situacao = (typeof SITUACOES_VALIDAS)[number]

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

/** Comparação em tempo constante para evitar timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function isSituacaoValida(value: unknown): value is Situacao {
  return typeof value === 'string' && (SITUACOES_VALIDAS as readonly string[]).includes(value)
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ erro: 'metodo_nao_permitido' }, 405)
  }

  const identificador = req.headers.get('x-dispositivo-id')?.trim()
  const token = req.headers.get('x-dispositivo-token')?.trim()
  if (!identificador || !token) {
    return json({ erro: 'credenciais_ausentes' }, 401)
  }

  let payload: unknown
  try {
    payload = await req.json()
  }
  catch {
    return json({ erro: 'json_invalido' }, 400)
  }

  const situacao = (payload as { situacao?: unknown } | null)?.situacao
  if (!isSituacaoValida(situacao)) {
    return json({ erro: 'situacao_invalida', esperado: SITUACOES_VALIDAS }, 400)
  }

  try {
    const { data: dispositivo, error: erroDispositivo } = await supabase
      .from('tbldispositivosiot')
      .select('id, vaga_id, token_hash, ativo')
      .eq('identificador', identificador)
      .maybeSingle()

    if (erroDispositivo) throw erroDispositivo

    const tokenHash = await sha256Hex(token)
    if (!dispositivo || !safeEqual(tokenHash, dispositivo.token_hash)) {
      return json({ erro: 'nao_autorizado' }, 401)
    }
    if (!dispositivo.ativo) {
      return json({ erro: 'dispositivo_inativo' }, 403)
    }

    const { data: vaga, error: erroVaga } = await supabase
      .from('tblvagas')
      .select('id, numero, tipo, situacao')
      .eq('id', dispositivo.vaga_id)
      .single()

    if (erroVaga) throw erroVaga
    if (vaga.tipo !== 'fisica') {
      return json({ erro: 'vaga_nao_fisica' }, 409)
    }

    await supabase
      .from('tbldispositivosiot')
      .update({ ultimo_contato_em: new Date().toISOString() })
      .eq('id', dispositivo.id)

    const alterada = vaga.situacao !== situacao
    if (alterada) {
      const { error: erroAtualizacao } = await supabase
        .from('tblvagas')
        .update({ situacao })
        .eq('id', vaga.id)
      if (erroAtualizacao) throw erroAtualizacao
    }

    return json({ ok: true, numero_vaga: vaga.numero, situacao, alterada })
  }
  catch (erro) {
    console.error('[iot-situacao-vaga]', erro)
    return json({ erro: 'erro_interno' }, 500)
  }
})
