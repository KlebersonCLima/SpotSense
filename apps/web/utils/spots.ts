import type { SpotStatus, SpotType } from '@spotsense/shared'

export interface SpotStats {
  total: number
  occupied: number
  available: number
  physical: number
  /** Ocupação de 0 a 100. */
  occupancyRate: number
}

export function summarizeSpots(spots: ReadonlyArray<{ status: SpotStatus | string, type: SpotType | string }>): SpotStats {
  const total = spots.length
  const occupied = spots.filter(spot => spot.status === 'occupied').length
  const physical = spots.filter(spot => spot.type === 'physical').length
  return {
    total,
    occupied,
    available: total - occupied,
    physical,
    occupancyRate: total ? Math.round((occupied / total) * 100) : 0,
  }
}

export const SPOT_STATUS_LABEL: Record<SpotStatus, string> = {
  available: 'Disponível',
  occupied: 'Ocupada',
}

export const SPOT_TYPE_LABEL: Record<SpotType, string> = {
  simulated: 'Simulada',
  physical: 'Física (IoT)',
}
