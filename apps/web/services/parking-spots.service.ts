import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ParkingSpot, SpotHistoryEntry, SpotStatus, SpotType, TablesInsert } from '@spotsense/shared'

type Client = SupabaseClient<Database>

export type SpotHistoryWithSpot = SpotHistoryEntry & { spot: { spot_number: number } }

const SPOT_COLUMNS = 'id, parking_lot_id, spot_number, type, status, last_updated_at, created_at, updated_at'

/** Monta as linhas de vagas numeradas a partir de `startNumber`; as últimas `physicalCount` são físicas. */
export function buildSpotRows(
  parkingLotId: string,
  startNumber: number,
  count: number,
  physicalCount = 0,
): TablesInsert<'tblvagas'>[] {
  return Array.from({ length: count }, (_, index) => ({
    parking_lot_id: parkingLotId,
    spot_number: startNumber + index,
    type: index >= count - physicalCount ? 'physical' : 'simulated',
    status: 'available',
  }))
}

export function parkingSpotsService(client: Client) {
  return {
    async list(parkingLotId: string): Promise<ParkingSpot[]> {
      const { data, error } = await client
        .from('tblvagas')
        .select(SPOT_COLUMNS)
        .eq('parking_lot_id', parkingLotId)
        .order('spot_number')
      if (error) throw error
      return data as ParkingSpot[]
    },

    async add(parkingLotId: string, startNumber: number, count: number, type: SpotType): Promise<void> {
      const rows = buildSpotRows(parkingLotId, startNumber, count, type === 'physical' ? count : 0)
      const { error } = await client.from('tblvagas').insert(rows)
      if (error) throw error
    },

    async setStatus(id: string, status: SpotStatus): Promise<ParkingSpot> {
      const { data, error } = await client
        .from('tblvagas')
        .update({ status })
        .eq('id', id)
        .select(SPOT_COLUMNS)
        .single()
      if (error) throw error
      return data as ParkingSpot
    },

    async setType(id: string, type: SpotType): Promise<ParkingSpot> {
      const { data, error } = await client
        .from('tblvagas')
        .update({ type })
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
        .select('*, spot:tblvagas!inner(spot_number, parking_lot_id)')
        .eq('spot.parking_lot_id', parkingLotId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as unknown as SpotHistoryWithSpot[]
    },
  }
}
