import type { Tables } from './database.types'

/** Tipos de vaga: simulada (controle manual) ou física (controle exclusivo do IoT). */
export const SPOT_TYPES = ['simulada', 'fisica'] as const
export type SpotType = (typeof SPOT_TYPES)[number]

/** Estados possíveis de uma vaga. */
export const SPOT_STATUSES = ['livre', 'ocupada'] as const
export type SpotStatus = (typeof SPOT_STATUSES)[number]

/** Origem de uma mudança de estado registrada no histórico. */
export type SpotChangeSource = 'manual' | 'sensor'

/** Estacionamento (tblestacionamentos). */
export type ParkingLot = Tables<'tblestacionamentos'>

/** Vaga (tblvagas) com tipo e status estreitados. */
export type ParkingSpot = Omit<Tables<'tblvagas'>, 'tipo' | 'situacao'> & {
  tipo: SpotType
  situacao: SpotStatus
}

/** Dispositivo IoT sem o hash do token (que nunca chega ao frontend). */
export type IotDevice = Omit<Tables<'tbldispositivosiot'>, 'token_hash'>

/** Registro do histórico de vagas. */
export type SpotHistoryEntry = Omit<Tables<'tblhistoricovagas'>, 'situacao_anterior' | 'situacao_nova' | 'origem'> & {
  situacao_anterior: SpotStatus | null
  situacao_nova: SpotStatus
  origem: SpotChangeSource
}

/** Retorno de registrar_dispositivo_iot: o token só é exibido uma vez. */
export interface RegisteredIotDevice {
  dispositivo_id: string
  identificador: string
  token: string
}

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './database.types'
