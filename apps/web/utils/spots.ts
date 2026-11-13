import type { SituacaoVaga, TipoVaga } from '@spotsense/shared'

export interface EstatisticasVagas {
  total: number
  occupied: number
  available: number
  physical: number
  /** Ocupação de 0 a 100. */
  occupancyRate: number
}

export function resumirVagas(spots: ReadonlyArray<{ situacao: SituacaoVaga | string, tipo: TipoVaga | string }>): EstatisticasVagas {
  const total = spots.length
  const occupied = spots.filter(spot => spot.situacao === 'ocupada').length
  const physical = spots.filter(spot => spot.tipo === 'fisica').length
  return {
    total,
    occupied,
    available: total - occupied,
    physical,
    occupancyRate: total ? Math.round((occupied / total) * 100) : 0,
  }
}

export const ROTULO_SITUACAO_VAGA: Record<SituacaoVaga, string> = {
  livre: 'Disponível',
  ocupada: 'Ocupada',
}

export const ROTULO_TIPO_VAGA: Record<TipoVaga, string> = {
  simulada: 'Simulada',
  fisica: 'Física (IoT)',
}
