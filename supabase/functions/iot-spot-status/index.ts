// SpotSense — recebe o estado de uma vaga física enviado pelo ESP32.
//
// POST /functions/v1/iot-spot-status
// Headers: x-device-id: <identificador>   x-device-token: <token do dispositivo>
// Body:    { "status": "occupied" | "available" }
//
// A autenticação é feita pelo token do dispositivo (o banco guarda apenas o hash SHA-256).
// A service_role key existe somente aqui, no ambiente da função.

import { createClient } from 'npm:@supabase/supabase-js@2'

const VALID_STATUSES = ['available', 'occupied'] as const
type SpotStatus = (typeof VALID_STATUSES)[number]

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

function isValidStatus(value: unknown): value is SpotStatus {
  return typeof value === 'string' && (VALID_STATUSES as readonly string[]).includes(value)
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const deviceId = req.headers.get('x-device-id')?.trim()
  const deviceToken = req.headers.get('x-device-token')?.trim()
  if (!deviceId || !deviceToken) {
    return json({ error: 'missing_credentials' }, 401)
  }

  let payload: unknown
  try {
    payload = await req.json()
  }
  catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const status = (payload as { status?: unknown } | null)?.status
  if (!isValidStatus(status)) {
    return json({ error: 'invalid_status', expected: VALID_STATUSES }, 400)
  }

  try {
    const { data: device, error: deviceError } = await supabase
      .from('tbldispositivosiot')
      .select('id, parking_spot_id, device_token_hash, is_active')
      .eq('device_identifier', deviceId)
      .maybeSingle()

    if (deviceError) throw deviceError

    const tokenHash = await sha256Hex(deviceToken)
    if (!device || !safeEqual(tokenHash, device.device_token_hash)) {
      return json({ error: 'unauthorized' }, 401)
    }
    if (!device.is_active) {
      return json({ error: 'device_inactive' }, 403)
    }

    const { data: spot, error: spotError } = await supabase
      .from('tblvagas')
      .select('id, spot_number, type, status')
      .eq('id', device.parking_spot_id)
      .single()

    if (spotError) throw spotError
    if (spot.type !== 'physical') {
      return json({ error: 'spot_not_physical' }, 409)
    }

    await supabase
      .from('tbldispositivosiot')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', device.id)

    const changed = spot.status !== status
    if (changed) {
      const { error: updateError } = await supabase
        .from('tblvagas')
        .update({ status })
        .eq('id', spot.id)
      if (updateError) throw updateError
    }

    return json({ ok: true, spot_number: spot.spot_number, status, changed })
  }
  catch (error) {
    console.error('[iot-spot-status]', error)
    return json({ error: 'internal_error' }, 500)
  }
})
