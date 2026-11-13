<script setup lang="ts">
import type { Vaga, TipoVaga } from '@spotsense/shared'
import type { NovoEstacionamentoInput } from '~/services/estacionamentos.service'

const route = useRoute()
const parkingLotId = String(route.params.id)
const { parkingLots, spots: spotsService } = useServices()
const toast = useToast()

const { data: lot, refresh: refreshLot } = await useAsyncData(`lot:${parkingLotId}`, () => parkingLots.getById(parkingLotId))

if (!lot.value) {
  throw createError({ statusCode: 404, statusMessage: 'Estacionamento não encontrado', fatal: true })
}

useSeoMeta({ title: () => `${lot.value?.nome ?? 'Estacionamento'} · SpotSense` })

// Somente no cliente: exibe horários relativos ("há 2 min"), que mudariam entre SSR e hidratação
const { data: history, refresh: refreshHistory } = useAsyncData(
  `history:${parkingLotId}`,
  () => spotsService.history(parkingLotId),
  { default: () => [], server: false },
)

const {
  bySpotId: devices,
  refresh: refreshDevices,
  register,
  setActive: setDeviceActive,
  remove: removeDevice,
} = useDispositivos(parkingLotId)

const {
  spots,
  stats,
  recentlyChanged,
  nextSpotNumber,
  toggleStatus,
  addSpots,
  setType,
  removeSpot,
} = useVagas(parkingLotId, {
  // Nova mudança: atualiza o feed e o "visto há…" dos sensores
  onRealtimeChange: () => {
    refreshHistory()
    refreshDevices()
  },
})

const tabs = [
  { label: 'Mapa ao vivo', icon: 'i-lucide-map', slot: 'map' as const },
  { label: 'Gerenciar vagas', icon: 'i-lucide-sliders-horizontal', slot: 'manage' as const },
]

// Edição do estacionamento
function openEdit() {
  formOpen.value = true
}

const formOpen = ref(false)
const saving = ref(false)

async function onEdit(data: NovoEstacionamentoInput) {
  saving.value = true
  try {
    const { nome, endereco, descricao, ativo } = data
    await parkingLots.update(parkingLotId, { nome, endereco, descricao, ativo })
    await refreshLot()
    formOpen.value = false
    toast.add({ title: 'Estacionamento atualizado', icon: 'i-lucide-check-circle-2', color: 'success' })
  }
  catch (error) {
    toast.add({ title: 'Não foi possível salvar', description: getErrorMessage(error), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    saving.value = false
  }
}

// Adicionar vagas
const adding = ref(false)
async function onAdd(count: number, type: TipoVaga) {
  adding.value = true
  await addSpots(count, type)
  adding.value = false
}

// Exclusão de vaga
const spotToDelete = ref<Vaga | null>(null)
const confirmOpen = ref(false)

function askRemoveSpot(spot: Vaga) {
  spotToDelete.value = spot
  confirmOpen.value = true
}

async function confirmRemoveSpot() {
  if (spotToDelete.value) await removeSpot(spotToDelete.value)
  confirmOpen.value = false
}

// Dispositivo IoT
const deviceSpot = ref<Vaga | null>(null)
const deviceModalOpen = ref(false)
const deviceOfSpot = computed(() => (deviceSpot.value ? devices.value.get(deviceSpot.value.id) ?? null : null))

function openDevice(spot: Vaga) {
  deviceSpot.value = spot
  deviceModalOpen.value = true
}
</script>

<template>
  <section v-if="lot" class="space-y-6">
    <PageHeader :title="lot.nome" :description="lot.descricao ?? undefined">
      <template #eyebrow>
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <NuxtLink to="/estacionamentos" class="flex items-center gap-1 text-[var(--ss-text-muted)] hover:text-[var(--ss-text)]">
            <UIcon name="i-lucide-arrow-left" class="size-4" /> Estacionamentos
          </NuxtLink>
          <UBadge
            :color="lot.ativo ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
            :label="lot.ativo ? 'Ativo' : 'Inativo'"
          />
          <span v-if="lot.endereco" class="flex items-center gap-1 text-[var(--ss-text-muted)]">
            <UIcon name="i-lucide-map-pin" class="size-3.5" /> {{ lot.endereco }}
          </span>
        </div>
      </template>
      <template #actions>
        <UButton icon="i-lucide-pencil" color="neutral" variant="outline" label="Editar" @click="openEdit" />
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Disponíveis" :value="stats.available" icon="i-lucide-circle-check" highlight :hint="`de ${stats.total} vagas`" />
      <StatCard label="Ocupadas" :value="stats.occupied" icon="i-lucide-car" />
      <StatCard label="Ocupação" :value="`${stats.occupancyRate}%`" icon="i-lucide-gauge" />
      <StatCard label="Vagas físicas" :value="stats.physical" icon="i-lucide-radio" hint="controladas por sensor" />
    </div>

    <UTabs :items="tabs" variant="link" class="gap-6" :unmount-on-hide="false">
      <template #map>
        <EmptyState
          v-if="!spots.length"
          icon="i-lucide-grid-2x2-plus"
          title="Nenhuma vaga cadastrada"
        />
        <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <MapaEstacionamento :spots="spots" :devices="devices" :recently-changed="recentlyChanged" @toggle="toggleStatus" />
          <AtividadeVagas :entries="history" />
        </div>
      </template>

      <template #manage>
        <GerenciadorVagas
          :spots="spots"
          :devices="devices"
          :next-spot-number="nextSpotNumber"
          :adding="adding"
          @add="onAdd"
          @toggle="toggleStatus"
          @set-type="setType"
          @remove="askRemoveSpot"
          @manage-device="openDevice"
        />
      </template>
    </UTabs>

    <EstacionamentoFormModal v-model:open="formOpen" :lot="lot" :loading="saving" @submit="onEdit" />

    <ConfirmModal
      v-model:open="confirmOpen"
      :title="`Excluir vaga ${spotToDelete?.numero ?? ''}?`"
      description="O histórico e o dispositivo IoT vinculados a esta vaga também serão excluídos."
      @confirm="confirmRemoveSpot"
    />

    <DispositivoModal
      v-model:open="deviceModalOpen"
      :spot="deviceSpot"
      :device="deviceOfSpot"
      :register="register"
      @set-active="setDeviceActive"
      @remove="(device) => { removeDevice(device); deviceModalOpen = false }"
    />
  </section>
</template>
