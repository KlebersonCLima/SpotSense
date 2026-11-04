<script setup lang="ts">
import type { ParkingSpot, SpotType } from '@spotsense/shared'
import type { NewParkingLotInput } from '~/services/parking-lots.service'

const route = useRoute()
const parkingLotId = String(route.params.id)
const { parkingLots, spots: spotsService } = useServices()
const toast = useToast()

const { data: lot, refresh: refreshLot } = await useAsyncData(`lot:${parkingLotId}`, () => parkingLots.getById(parkingLotId))

if (!lot.value) {
  throw createError({ statusCode: 404, statusMessage: 'Estacionamento não encontrado', fatal: true })
}

useSeoMeta({ title: () => `${lot.value?.name ?? 'Estacionamento'} · SpotSense` })

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
} = useIotDevices(parkingLotId)

const {
  spots,
  stats,
  recentlyChanged,
  nextSpotNumber,
  toggleStatus,
  addSpots,
  setType,
  removeSpot,
} = useParkingSpots(parkingLotId, {
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

async function onEdit(data: NewParkingLotInput) {
  saving.value = true
  try {
    const { name, address, description, is_active } = data
    await parkingLots.update(parkingLotId, { name, address, description, is_active })
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
async function onAdd(count: number, type: SpotType) {
  adding.value = true
  await addSpots(count, type)
  adding.value = false
}

// Exclusão de vaga
const spotToDelete = ref<ParkingSpot | null>(null)
const confirmOpen = ref(false)

function askRemoveSpot(spot: ParkingSpot) {
  spotToDelete.value = spot
  confirmOpen.value = true
}

async function confirmRemoveSpot() {
  if (spotToDelete.value) await removeSpot(spotToDelete.value)
  confirmOpen.value = false
}

// Dispositivo IoT
const deviceSpot = ref<ParkingSpot | null>(null)
const deviceModalOpen = ref(false)
const deviceOfSpot = computed(() => (deviceSpot.value ? devices.value.get(deviceSpot.value.id) ?? null : null))

function openDevice(spot: ParkingSpot) {
  deviceSpot.value = spot
  deviceModalOpen.value = true
}
</script>

<template>
  <section v-if="lot" class="space-y-6">
    <PageHeader :title="lot.name" :description="lot.description ?? undefined">
      <template #eyebrow>
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <NuxtLink to="/parking-lots" class="flex items-center gap-1 text-[var(--ss-text-muted)] hover:text-[var(--ss-text)]">
            <UIcon name="i-lucide-arrow-left" class="size-4" /> Estacionamentos
          </NuxtLink>
          <UBadge
            :color="lot.is_active ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
            :label="lot.is_active ? 'Ativo' : 'Inativo'"
          />
          <span v-if="lot.address" class="flex items-center gap-1 text-[var(--ss-text-muted)]">
            <UIcon name="i-lucide-map-pin" class="size-3.5" /> {{ lot.address }}
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
        <div v-else class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <ParkingMap :spots="spots" :devices="devices" :recently-changed="recentlyChanged" @toggle="toggleStatus" />
          <SpotActivityFeed :entries="history" />
        </div>
      </template>

      <template #manage>
        <SpotsManager
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

    <ParkingLotFormModal v-model:open="formOpen" :lot="lot" :loading="saving" @submit="onEdit" />

    <ConfirmModal
      v-model:open="confirmOpen"
      :title="`Excluir vaga ${spotToDelete?.spot_number ?? ''}?`"
      description="O histórico e o dispositivo IoT vinculados a esta vaga também serão excluídos."
      @confirm="confirmRemoveSpot"
    />

    <IotDeviceModal
      v-model:open="deviceModalOpen"
      :spot="deviceSpot"
      :device="deviceOfSpot"
      :register="register"
      @set-active="setDeviceActive"
      @remove="(device) => { removeDevice(device); deviceModalOpen = false }"
    />
  </section>
</template>
