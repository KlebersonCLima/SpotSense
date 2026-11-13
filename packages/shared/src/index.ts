import type { Tables } from './database.types'

/** Tipos de vaga: simulada (controle manual) ou física (controle exclusivo do IoT). */
export const TIPOS_VAGA = ['simulada', 'fisica'] as const
export type TipoVaga = (typeof TIPOS_VAGA)[number]

/** Estados possíveis de uma vaga. */
export const SITUACOES_VAGA = ['livre', 'ocupada'] as const
export type SituacaoVaga = (typeof SITUACOES_VAGA)[number]

/** Origem de uma mudança de estado registrada no histórico. */
export type OrigemMudancaVaga = 'manual' | 'sensor'

/** Estacionamento (tblestacionamentos). */
export type Estacionamento = Tables<'tblestacionamentos'>

/** Vaga (tblvagas) com tipo e status estreitados. */
export type Vaga = Omit<Tables<'tblvagas'>, 'tipo' | 'situacao'> & {
  tipo: TipoVaga
  situacao: SituacaoVaga
}

/** Dispositivo IoT sem o hash do token (que nunca chega ao frontend). */
export type Dispositivo = Omit<Tables<'tbldispositivosiot'>, 'token_hash'>

/** Registro do histórico de vagas. */
export type HistoricoVaga = Omit<Tables<'tblhistoricovagas'>, 'situacao_anterior' | 'situacao_nova' | 'origem'> & {
  situacao_anterior: SituacaoVaga | null
  situacao_nova: SituacaoVaga
  origem: OrigemMudancaVaga
}

/** Retorno de registrar_dispositivo_iot: o token só é exibido uma vez. */
export interface DispositivoRegistrado {
  dispositivo_id: string
  identificador: string
  token: string
}

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './database.types'
