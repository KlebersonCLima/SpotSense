import type { Tables } from './database.types'

/** Tipos de vaga: simulada (controle manual) ou física (controle exclusivo do IoT). */
export const SPOT_TYPES = ['simulated', 'physical'] as const
export type SpotType = (typeof SPOT_TYPES)[number]

/** Estados possíveis de uma vaga. */
export const SPOT_STATUSES = ['available', 'occupied'] as const
export type SpotStatus = (typeof SPOT_STATUSES)[number]

/** Origem de uma mudança de estado registrada no histórico. */
export type SpotChangeSource = 'manual' | 'iot'

/** Estacionamento (tblestacionamentos). */
export type ParkingLot = Tables<'tblestacionamentos'>

/** Vaga (tblvagas) com tipo e status estreitados. */
export type ParkingSpot = Omit<Tables<'tblvagas'>, 'type' | 'status'> & {
  type: SpotType
  status: SpotStatus
}

/** Dispositivo IoT sem o hash do token (que nunca chega ao frontend). */
export type IotDevice = Omit<Tables<'tbldispositivosiot'>, 'device_token_hash'>

/** Registro do histórico de vagas. */
export type SpotHistoryEntry = Omit<Tables<'tblhistoricovagas'>, 'previous_status' | 'new_status' | 'source'> & {
  previous_status: SpotStatus | null
  new_status: SpotStatus
  source: SpotChangeSource
}

/** Retorno de register_iot_device: o token só é exibido uma vez. */
export interface RegisteredIotDevice {
  device_id: string
  device_identifier: string
  device_token: string
}

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './database.types'
