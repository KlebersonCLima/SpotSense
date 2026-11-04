import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { ParkingSpot } from '@spotsense/shared'

export type SpotChangePayload = RealtimePostgresChangesPayload<ParkingSpot>

interface Options {
  /** Quando informado, escuta apenas as vagas deste estacionamento. */
  parkingLotId?: string
  onChange: (payload: SpotChangePayload) => void
}

/** Escuta alterações em tblvagas via Supabase Realtime enquanto o componente estiver montado. */
export function useSpotsRealtime({ parkingLotId, onChange }: Options) {
  const client = useSupabaseClient()
  let channel: RealtimeChannel | null = null

  onMounted(() => {
    channel = client
      .channel(`tblvagas:${parkingLotId ?? 'all'}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tblvagas',
          ...(parkingLotId ? { filter: `parking_lot_id=eq.${parkingLotId}` } : {}),
        },
        payload => onChange(payload as SpotChangePayload),
      )
      .subscribe()
  })

  onBeforeUnmount(() => {
    if (channel) client.removeChannel(channel)
  })
}
