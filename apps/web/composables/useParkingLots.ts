import type { NewParkingLotInput, ParkingLotInput, ParkingLotWithSpots } from '~/services/parking-lots.service'

/** Lista de estacionamentos com resumo das vagas + ações de CRUD (com notificações). */
export function useParkingLots() {
  const { parkingLots } = useServices()
  const toast = useToast()

  const { data: lots, status, error, refresh } = useAsyncData(
    'parking-lots',
    () => parkingLots.list(),
    { default: () => [] as ParkingLotWithSpots[] },
  )

  // Inserções/exclusões chegam em lote (ex.: criar 50 vagas): agrupa em um único refresh
  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  function scheduleRefresh() {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => refresh(), 400)
  }
  onBeforeUnmount(() => clearTimeout(refreshTimer))

  // Mantém os contadores de ocupação atualizados em tempo real
  useSpotsRealtime({
    onChange: (payload) => {
      if (payload.eventType !== 'UPDATE') {
        scheduleRefresh()
        return
      }
      for (const lot of lots.value) {
        const spot = lot.spots.find(item => item.id === payload.new.id)
        if (spot) Object.assign(spot, { status: payload.new.status, type: payload.new.type })
      }
    },
  })

  async function run<T>(action: () => Promise<T>, successMessage: string): Promise<T | undefined> {
    try {
      const result = await action()
      toast.add({ title: successMessage, icon: 'i-lucide-check-circle-2', color: 'success' })
      await refresh()
      return result
    }
    catch (err) {
      toast.add({ title: 'Não foi possível concluir', description: getErrorMessage(err), icon: 'i-lucide-circle-alert', color: 'error' })
      return undefined
    }
  }

  return {
    lots,
    status,
    error,
    refresh,
    create: (input: NewParkingLotInput) => run(() => parkingLots.create(input), 'Estacionamento criado'),
    update: (id: string, input: Partial<ParkingLotInput>) => run(() => parkingLots.update(id, input), 'Estacionamento atualizado'),
    setActive: (id: string, isActive: boolean) =>
      run(() => parkingLots.update(id, { is_active: isActive }), isActive ? 'Estacionamento ativado' : 'Estacionamento desativado'),
    remove: (id: string) => run(() => parkingLots.remove(id), 'Estacionamento excluído'),
  }
}
