import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, IotDevice, RegisteredIotDevice } from '@spotsense/shared'

type Client = SupabaseClient<Database>

// O hash do token não tem permissão de leitura para usuários: sempre listar colunas explícitas.
const DEVICE_COLUMNS = 'id, parking_spot_id, device_identifier, last_seen_at, is_active, created_at, updated_at'

export function iotDevicesService(client: Client) {
  return {
    async listByParkingLot(parkingLotId: string): Promise<IotDevice[]> {
      const { data, error } = await client
        .from('tbldispositivosiot')
        .select(`${DEVICE_COLUMNS}, spot:tblvagas!inner(parking_lot_id)`)
        .eq('spot.parking_lot_id', parkingLotId)
      if (error) throw error
      return (data ?? []).map(({ spot: _spot, ...device }) => device as IotDevice)
    },

    /** Gera um novo token (o anterior deixa de funcionar). O token é retornado só uma vez. */
    async register(parkingSpotId: string, deviceIdentifier: string): Promise<RegisteredIotDevice> {
      const { data, error } = await client.rpc('register_iot_device', {
        p_parking_spot_id: parkingSpotId,
        p_device_identifier: deviceIdentifier,
      })
      if (error) throw error
      return data as unknown as RegisteredIotDevice
    },

    async setActive(id: string, isActive: boolean): Promise<void> {
      const { error } = await client.from('tbldispositivosiot').update({ is_active: isActive }).eq('id', id)
      if (error) throw error
    },

    async remove(id: string): Promise<void> {
      const { error } = await client.from('tbldispositivosiot').delete().eq('id', id)
      if (error) throw error
    },
  }
}
