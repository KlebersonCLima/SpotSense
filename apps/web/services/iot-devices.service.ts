import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, IotDevice, RegisteredIotDevice } from '@spotsense/shared'

type Client = SupabaseClient<Database>

// O hash do token não tem permissão de leitura para usuários: sempre listar colunas explícitas.
const DEVICE_COLUMNS = 'id, vaga_id, identificador, ultimo_contato_em, ativo, criado_em, atualizado_em'

export function iotDevicesService(client: Client) {
  return {
    async listByParkingLot(parkingLotId: string): Promise<IotDevice[]> {
      const { data, error } = await client
        .from('tbldispositivosiot')
        .select(`${DEVICE_COLUMNS}, spot:tblvagas!inner(estacionamento_id)`)
        .eq('spot.estacionamento_id', parkingLotId)
      if (error) throw error
      return (data ?? []).map(({ spot: _spot, ...device }) => device as IotDevice)
    },

    /** Gera um novo token (o anterior deixa de funcionar). O token é retornado só uma vez. */
    async register(parkingSpotId: string, deviceIdentifier: string): Promise<RegisteredIotDevice> {
      const { data, error } = await client.rpc('registrar_dispositivo_iot', {
        p_vaga_id: parkingSpotId,
        p_identificador: deviceIdentifier,
      })
      if (error) throw error
      return data as unknown as RegisteredIotDevice
    },

    async setActive(id: string, isActive: boolean): Promise<void> {
      const { error } = await client.from('tbldispositivosiot').update({ ativo: isActive }).eq('id', id)
      if (error) throw error
    },

    async remove(id: string): Promise<void> {
      const { error } = await client.from('tbldispositivosiot').delete().eq('id', id)
      if (error) throw error
    },
  }
}
