import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ParkingLot, ParkingSpot } from '@spotsense/shared'
import { buildSpotRows } from './parking-spots.service'

type Client = SupabaseClient<Database>

export type SpotSummary = Pick<ParkingSpot, 'id' | 'situacao' | 'tipo'>
export type ParkingLotWithSpots = ParkingLot & { spots: SpotSummary[] }

export interface ParkingLotInput {
  nome: string
  descricao?: string | null
  endereco?: string | null
  ativo: boolean
}

export interface NewParkingLotInput extends ParkingLotInput {
  spotCount: number
  physicalSpotCount: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Normaliza apenas os campos enviados (não sobrescreve os ausentes com null). */
function normalize(input: Partial<ParkingLotInput>) {
  const data: Partial<ParkingLotInput> = {}
  if (input.nome !== undefined) data.nome = input.nome.trim()
  if (input.endereco !== undefined) data.endereco = input.endereco?.trim() || null
  if (input.descricao !== undefined) data.descricao = input.descricao?.trim() || null
  if (input.ativo !== undefined) data.ativo = input.ativo
  return data
}

export function parkingLotsService(client: Client) {
  return {
    async list(): Promise<ParkingLotWithSpots[]> {
      const { data, error } = await client
        .from('tblestacionamentos')
        .select('*, spots:tblvagas(id, situacao, tipo)')
        .order('criado_em', { ascending: false })
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
        .insert({ ...normalize(lot), nome: lot.nome.trim() })
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
