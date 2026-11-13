import { dispositivosService } from '~/services/dispositivos.service'
import { estacionamentosService } from '~/services/estacionamentos.service'
import { vagasService } from '~/services/vagas.service'

/** Serviços de acesso ao Supabase já ligados ao client da sessão atual. */
export function useServices() {
  const client = useSupabaseClient()
  return {
    parkingLots: estacionamentosService(client),
    spots: vagasService(client),
    devices: dispositivosService(client),
  }
}
