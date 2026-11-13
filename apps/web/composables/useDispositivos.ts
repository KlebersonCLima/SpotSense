import type { Dispositivo, DispositivoRegistrado } from '@spotsense/shared'

/** Dispositivos IoT das vagas físicas de um estacionamento. */
export function useDispositivos(parkingLotId: string) {
  const { devices: service } = useServices()
  const toast = useToast()

  const { data: devices, refresh } = useAsyncData(
    `devices:${parkingLotId}`,
    () => service.listByEstacionamento(parkingLotId),
    // Somente no cliente: a interface mostra horários relativos ("visto há…")
    { default: () => [] as Dispositivo[], server: false },
  )

  const bySpotId = computed(() => new Map(devices.value.map(device => [device.vaga_id, device])))

  function notifyError(error: unknown) {
    toast.add({ title: 'Não foi possível concluir', description: getErrorMessage(error), icon: 'i-lucide-circle-alert', color: 'error' })
  }

  async function register(parkingSpotId: string, identifier: string): Promise<DispositivoRegistrado | null> {
    try {
      const result = await service.register(parkingSpotId, identifier)
      await refresh()
      return result
    }
    catch (error) {
      notifyError(error)
      return null
    }
  }

  async function setActive(device: Dispositivo, isActive: boolean) {
    try {
      await service.setActive(device.id, isActive)
      await refresh()
    }
    catch (error) {
      notifyError(error)
    }
  }

  async function remove(device: Dispositivo) {
    try {
      await service.remove(device.id)
      toast.add({ title: 'Dispositivo removido', icon: 'i-lucide-trash-2' })
      await refresh()
    }
    catch (error) {
      notifyError(error)
    }
  }

  return { devices, bySpotId, refresh, register, setActive, remove }
}
