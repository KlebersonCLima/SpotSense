import { iotDevicesService } from '~/services/iot-devices.service'
import { parkingLotsService } from '~/services/parking-lots.service'
import { parkingSpotsService } from '~/services/parking-spots.service'

/** Serviços de acesso ao Supabase já ligados ao client da sessão atual. */
export function useServices() {
  const client = useSupabaseClient()
  return {
    parkingLots: parkingLotsService(client),
    spots: parkingSpotsService(client),
    devices: iotDevicesService(client),
  }
}
