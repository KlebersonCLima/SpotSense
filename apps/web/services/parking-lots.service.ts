import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ParkingLot, ParkingSpot } from '@spotsense/shared'
import { buildSpotRows } from './parking-spots.service'

type Client = SupabaseClient<Database>

export type SpotSummary = Pick<ParkingSpot, 'id' | 'status' | 'type'>
export type ParkingLotWithSpots = ParkingLot & { spots: SpotSummary[] }

export interface ParkingLotInput {
  name: string
  description?: string | null
  address?: string | null
  is_active: boolean
}

export interface NewParkingLotInput extends ParkingLotInput {
  spotCount: number
  physicalSpotCount: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Normaliza apenas os campos enviados (não sobrescreve os ausentes com null). */
function normalize(input: Partial<ParkingLotInput>) {
  const data: Partial<ParkingLotInput> = {}
  if (input.name !== undefined) data.name = input.name.trim()
  if (input.address !== undefined) data.address = input.address?.trim() || null
  if (input.description !== undefined) data.description = input.description?.trim() || null
  if (input.is_active !== undefined) data.is_active = input.is_active
  return data
}

export function parkingLotsService(client: Client) {
  return {
    async list(): Promise<ParkingLotWithSpots[]> {
      const { data, error } = await client
        .from('tblestacionamentos')
        .select('*, spots:tblvagas(id, status, type)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as ParkingLotWithSpots[]
    },

    async getById(id: string): Promise<ParkingLot | null> {
      if (!UUID_PATTERN.test(id)) return null
      const { data, error } = await client.from('tblestacionamentos').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data
    },

    /** Cria o estacionamento e suas vagas (as últimas `physicalSpotCount` são físicas). */
    async create({ spotCount, physicalSpotCount, ...lot }: NewParkingLotInput): Promise<ParkingLot> {
      const { data, error } = await client
        .from('tblestacionamentos')
        .insert({ ...normalize(lot), name: lot.name.trim() })
        .select()
        .single()
      if (error) throw error

      if (spotCount > 0) {
        const { error: spotsError } = await client
          .from('tblvagas')
          .insert(buildSpotRows(data.id, 1, spotCount, physicalSpotCount))
        if (spotsError) {
          await client.from('tblestacionamentos').delete().eq('id', data.id)
          throw spotsError
        }
      }
      return data
    },

    async update(id: string, input: Partial<ParkingLotInput>): Promise<ParkingLot> {
      const { data, error } = await client
        .from('tblestacionamentos')
        .update(normalize(input))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async remove(id: string): Promise<void> {
      const { error } = await client.from('tblestacionamentos').delete().eq('id', id)
      if (error) throw error
    },
  }
}
