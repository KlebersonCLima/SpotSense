import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ParkingSpot, SpotHistoryEntry, SpotStatus, SpotType, TablesInsert } from '@spotsense/shared'

type Client = SupabaseClient<Database>

export type SpotHistoryWithSpot = SpotHistoryEntry & { spot: { numero: number } }

const SPOT_COLUMNS = 'id, estacionamento_id, numero, tipo, situacao, situacao_atualizada_em, criado_em, atualizado_em'

/** Monta as linhas de vagas numeradas a partir de `startNumber`; as últimas `physicalCount` são físicas. */
export function buildSpotRows(
  parkingLotId: string,
  startNumber: number,
  count: number,
  physicalCount = 0,
): TablesInsert<'tblvagas'>[] {
  return Array.from({ length: count }, (_, index) => ({
    estacionamento_id: parkingLotId,
    numero: startNumber + index,
    tipo: index >= count - physicalCount ? 'fisica' : 'simulada',
    situacao: 'livre',
  }))
}

export function parkingSpotsService(client: Client) {
  return {
    async list(parkingLotId: string): Promise<ParkingSpot[]> {
      const { data, error } = await client
        .from('tblvagas')
        .select(SPOT_COLUMNS)
        .eq('estacionamento_id', parkingLotId)
        .order('numero')
      if (error) throw error
      return data as ParkingSpot[]
    },

    async add(parkingLotId: string, startNumber: number, count: number, type: SpotType): Promise<void> {
      const rows = buildSpotRows(parkingLotId, startNumber, count, type === 'fisica' ? count : 0)
      const { error } = await client.from('tblvagas').insert(rows)
      if (error) throw error
    },

    async setStatus(id: string, status: SpotStatus): Promise<ParkingSpot> {
      const { data, error } = await client
        .from('tblvagas')
        .update({ situacao: status })
        .eq('id', id)
        .select(SPOT_COLUMNS)
        .single()
      if (error) throw error
      return data as ParkingSpot
    },

    async setType(id: string, type: SpotType): Promise<ParkingSpot> {
      const { data, error } = await client
        .from('tblvagas')
        .update({ tipo: type })
        .eq('id', id)
        .select(SPOT_COLUMNS)
        .single()
      if (error) throw error
      return data as ParkingSpot
    },

    async remove(id: string): Promise<void> {
      const { error } = await client.from('tblvagas').delete().eq('id', id)
      if (error) throw error
    },

    async history(parkingLotId: string, limit = 15): Promise<SpotHistoryWithSpot[]> {
      const { data, error } = await client
        .from('tblhistoricovagas')
        .select('*, spot:tblvagas!inner(numero, estacionamento_id)')
        .eq('spot.estacionamento_id', parkingLotId)
        .order('criado_em', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as unknown as SpotHistoryWithSpot[]
    },
  }
}
