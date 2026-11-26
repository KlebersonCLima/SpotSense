import type { Vaga, TipoVaga } from '@spotsense/shared'

const FLASH_DURATION_MS = 1600

/** Vagas de um estacionamento com atualização em tempo real e ações. */
export interface MudancaTempoReal {
  /** A situação (livre/ocupada) mudou. */
  mudouSituacao: boolean
  /** A vaga é física: a mudança veio do sensor. */
  fisica: boolean
}

export function useVagas(parkingLotId: string, options: { onRealtimeChange?: (mudanca: MudancaTempoReal) => void } = {}) {
  const { spots: service } = useServices()
  const toast = useToast()

  const { data: spots, status, refresh } = useAsyncData(
    `spots:${parkingLotId}`,
    () => service.list(parkingLotId),
    { default: () => [] as Vaga[] },
  )

  /** Notificação a cada mudança do sensor (o usuário não precisa estar olhando o mapa). */
  function avisarMudancaDoSensor(spot: Vaga) {
    const ocupada = spot.situacao === 'ocupada'
    toast.add({
      title: `Vaga ${String(spot.numero).padStart(2, '0')} ficou ${ocupada ? 'ocupada' : 'disponível'}`,
      description: 'Detectado pelo sensor IoT',
      icon: 'i-lucide-radio',
      color: ocupada ? 'neutral' : 'primary',
      duration: 5000,
    })
  }

  /** IDs das vagas que mudaram há pouco (para animar no mapa). */
  const recentlyChanged = ref<Record<string, true>>({})

  function flash(id: string) {
    recentlyChanged.value = { ...recentlyChanged.value, [id]: true }
    setTimeout(() => {
      const { [id]: _removed, ...rest } = recentlyChanged.value
      recentlyChanged.value = rest
    }, FLASH_DURATION_MS)
  }

  function upsert(spot: Vaga) {
    const index = spots.value.findIndex(item => item.id === spot.id)
    if (index === -1) spots.value = [...spots.value, spot].sort((a, b) => a.numero - b.numero)
    else spots.value.splice(index, 1, spot)
  }

  useVagasRealtime({
    parkingLotId,
    onChange: (payload) => {
      let mudanca: MudancaTempoReal = { mudouSituacao: false, fisica: false }
      if (payload.eventType === 'DELETE') {
        spots.value = spots.value.filter(spot => spot.id !== payload.old.id)
      }
      else {
        const previous = spots.value.find(spot => spot.id === payload.new.id)
        upsert(payload.new)
        const mudouSituacao = Boolean(previous) && previous!.situacao !== payload.new.situacao
        if (mudouSituacao) flash(payload.new.id)
        mudanca = { mudouSituacao, fisica: payload.new.tipo === 'fisica' }
        if (mudanca.mudouSituacao && mudanca.fisica) avisarMudancaDoSensor(payload.new)
      }
      options.onRealtimeChange?.(mudanca)
    },
  })

  const stats = computed(() => resumirVagas(spots.value))
  const nextSpotNumber = computed(() => Math.max(0, ...spots.value.map(spot => spot.numero)) + 1)

  function notifyError(error: unknown) {
    toast.add({ title: 'Não foi possível concluir', description: getErrorMessage(error), icon: 'i-lucide-circle-alert', color: 'error' })
  }

  /** Alterna o estado de uma vaga simulada (atualização otimista). */
  async function toggleStatus(spot: Vaga) {
    if (spot.tipo === 'fisica') {
      toast.add({
        title: `Vaga ${spot.numero} é física`,
        description: 'O estado dela é definido apenas pelo sensor IoT.',
        icon: 'i-lucide-radio',
      })
      return
    }
    const previous = { ...spot }
    upsert({ ...spot, situacao: spot.situacao === 'ocupada' ? 'livre' : 'ocupada' })
    try {
      upsert(await service.setStatus(spot.id, spot.situacao === 'ocupada' ? 'livre' : 'ocupada'))
    }
    catch (error) {
      upsert(previous)
      notifyError(error)
    }
  }

  async function addSpots(count: number, type: TipoVaga) {
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

  async function setType(spot: Vaga, type: TipoVaga) {
    try {
      upsert(await service.setType(spot.id, type))
    }
    catch (error) {
      notifyError(error)
    }
  }

  async function removeSpot(spot: Vaga) {
    try {
      await service.remove(spot.id)
      spots.value = spots.value.filter(item => item.id !== spot.id)
      toast.add({ title: `Vaga ${spot.numero} excluída`, icon: 'i-lucide-trash-2' })
    }
    catch (error) {
      notifyError(error)
    }
  }

  return { spots, status, refresh, stats, recentlyChanged, nextSpotNumber, toggleStatus, addSpots, setType, removeSpot }
}
