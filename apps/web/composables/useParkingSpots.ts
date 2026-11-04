import type { ParkingSpot, SpotType } from '@spotsense/shared'

const FLASH_DURATION_MS = 1600

/** Vagas de um estacionamento com atualização em tempo real e ações. */
export function useParkingSpots(parkingLotId: string, options: { onRealtimeChange?: () => void } = {}) {
  const { spots: service } = useServices()
  const toast = useToast()

  const { data: spots, status, refresh } = useAsyncData(
    `spots:${parkingLotId}`,
    () => service.list(parkingLotId),
    { default: () => [] as ParkingSpot[] },
  )

  /** IDs das vagas que mudaram há pouco (para animar no mapa). */
  const recentlyChanged = ref<Record<string, true>>({})

  function flash(id: string) {
    recentlyChanged.value = { ...recentlyChanged.value, [id]: true }
    setTimeout(() => {
      const { [id]: _removed, ...rest } = recentlyChanged.value
      recentlyChanged.value = rest
    }, FLASH_DURATION_MS)
  }

  function upsert(spot: ParkingSpot) {
    const index = spots.value.findIndex(item => item.id === spot.id)
    if (index === -1) spots.value = [...spots.value, spot].sort((a, b) => a.spot_number - b.spot_number)
    else spots.value.splice(index, 1, spot)
  }

  useSpotsRealtime({
    parkingLotId,
    onChange: (payload) => {
      if (payload.eventType === 'DELETE') {
        spots.value = spots.value.filter(spot => spot.id !== payload.old.id)
      }
      else {
        const previous = spots.value.find(spot => spot.id === payload.new.id)
        upsert(payload.new)
        if (previous && previous.status !== payload.new.status) flash(payload.new.id)
      }
      options.onRealtimeChange?.()
    },
  })

  const stats = computed(() => summarizeSpots(spots.value))
  const nextSpotNumber = computed(() => Math.max(0, ...spots.value.map(spot => spot.spot_number)) + 1)

  function notifyError(error: unknown) {
    toast.add({ title: 'Não foi possível concluir', description: getErrorMessage(error), icon: 'i-lucide-circle-alert', color: 'error' })
  }

  /** Alterna o estado de uma vaga simulada (atualização otimista). */
  async function toggleStatus(spot: ParkingSpot) {
    if (spot.type === 'physical') {
      toast.add({
        title: `Vaga ${spot.spot_number} é física`,
        description: 'O estado dela é definido apenas pelo sensor IoT.',
        icon: 'i-lucide-radio',
      })
      return
    }
    const previous = { ...spot }
    upsert({ ...spot, status: spot.status === 'occupied' ? 'available' : 'occupied' })
    try {
      upsert(await service.setStatus(spot.id, spot.status === 'occupied' ? 'available' : 'occupied'))
    }
    catch (error) {
      upsert(previous)
      notifyError(error)
    }
  }

  async function addSpots(count: number, type: SpotType) {
    try {
      await service.add(parkingLotId, nextSpotNumber.value, count, type)
      toast.add({ title: count === 1 ? 'Vaga adicionada' : `${count} vagas adicionadas`, icon: 'i-lucide-check-circle-2', color: 'success' })
      await refresh()
      return true
    }
    catch (error) {
      notifyError(error)
      return false
    }
  }

  async function setType(spot: ParkingSpot, type: SpotType) {
    try {
      upsert(await service.setType(spot.id, type))
    }
    catch (error) {
      notifyError(error)
    }
  }

  async function removeSpot(spot: ParkingSpot) {
    try {
      await service.remove(spot.id)
      spots.value = spots.value.filter(item => item.id !== spot.id)
      toast.add({ title: `Vaga ${spot.spot_number} excluída`, icon: 'i-lucide-trash-2' })
    }
    catch (error) {
      notifyError(error)
    }
  }

  return { spots, status, refresh, stats, recentlyChanged, nextSpotNumber, toggleStatus, addSpots, setType, removeSpot }
}
