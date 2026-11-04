/** Tipos de vaga: simulada (controle manual) ou física (controle exclusivo do IoT). */
export const SPOT_TYPES = ['simulated', 'physical'] as const
export type SpotType = (typeof SPOT_TYPES)[number]

/** Estados possíveis de uma vaga. */
export const SPOT_STATUSES = ['available', 'occupied'] as const
export type SpotStatus = (typeof SPOT_STATUSES)[number]

export type { Database } from './database.types'
