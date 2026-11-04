<script setup lang="ts">
import type { IotDevice, ParkingSpot, SpotType } from '@spotsense/shared'

const props = withDefaults(defineProps<{
  spots: ParkingSpot[]
  devices?: Map<string, IotDevice>
  nextSpotNumber: number
  adding?: boolean
}>(), { devices: () => new Map(), adding: false })

const emit = defineEmits<{
  add: [count: number, type: SpotType]
  toggle: [spot: ParkingSpot]
  setType: [spot: ParkingSpot, type: SpotType]
  remove: [spot: ParkingSpot]
  manageDevice: [spot: ParkingSpot]
}>()

const typeItems = [
  { label: 'Simulada', value: 'simulated' },
  { label: 'Física (IoT)', value: 'physical' },
]

const newCount = ref<number | null>(1)
const newType = ref<SpotType>('simulated')

const count = computed(() => Math.min(200, Math.max(1, Math.floor(newCount.value ?? 1))))
const numberingHint = computed(() =>
  count.value > 1
    ? `Vagas ${props.nextSpotNumber} a ${props.nextSpotNumber + count.value - 1}`
    : `Vaga ${props.nextSpotNumber}`,
)

/** Colunas da lista no desktop (cabeçalho e linhas usam a mesma grade). */
const GRID = 'md:grid-cols-[4rem_12rem_10rem_minmax(0,1fr)_2.25rem]'
</script>

<template>
  <div class="space-y-4">
    <!-- adicionar vagas -->
    <div class="glass space-y-2 rounded-[var(--ss-radius-lg)] p-4">
      <div class="grid gap-4 sm:grid-cols-3 sm:items-end">
        <UFormField label="Quantidade">
          <UInputNumber v-model="newCount" :min="1" :max="200" class="w-full" />
        </UFormField>
        <UFormField label="Tipo">
          <USelect v-model="newType" :items="typeItems" class="w-full" />
        </UFormField>
        <UButton icon="i-lucide-plus" :loading="adding" block label="Adicionar vagas" @click="emit('add', count, newType)" />
      </div>
      <p class="text-xs text-[var(--ss-text-muted)]">
        Numeração: {{ numberingHint }}
      </p>
    </div>

    <EmptyState v-if="!spots.length" icon="i-lucide-grid-2x2" title="Nenhuma vaga cadastrada" />

    <!-- lista -->
    <div v-else class="glass overflow-hidden rounded-[var(--ss-radius-lg)]">
      <div
        class="hidden gap-4 border-b border-[var(--ss-glass-border)] px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--ss-text-muted)] md:grid"
        :class="GRID"
      >
        <span>Vaga</span>
        <span>Tipo</span>
        <span>Status</span>
        <span>Dispositivo</span>
        <span class="sr-only">Ações</span>
      </div>

      <ul class="divide-y divide-[var(--ss-glass-border)]">
        <li
          v-for="spot in spots"
          :key="spot.id"
          class="grid grid-cols-[3rem_minmax(0,1fr)_2.25rem] items-center gap-x-3 gap-y-2 px-4 py-3 md:gap-x-4"
          :class="GRID"
        >
          <span class="font-mono text-lg font-semibold md:order-1">{{ String(spot.spot_number).padStart(2, '0') }}</span>

          <USelect
            :model-value="spot.type"
            :items="typeItems"
            class="w-full md:order-2"
            :aria-label="`Tipo da vaga ${spot.spot_number}`"
            @update:model-value="(value) => emit('setType', spot, value as SpotType)"
          />

          <UButton
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            class="justify-self-end md:order-5"
            :aria-label="`Excluir vaga ${spot.spot_number}`"
            @click="emit('remove', spot)"
          />

          <UButton
            :color="spot.status === 'occupied' ? 'neutral' : 'primary'"
            :variant="spot.status === 'occupied' ? 'solid' : 'soft'"
            :icon="spot.type === 'physical' ? 'i-lucide-lock' : 'i-lucide-repeat'"
            :label="SPOT_STATUS_LABEL[spot.status]"
            :disabled="spot.type === 'physical'"
            :title="spot.type === 'physical' ? 'Controlada pelo sensor IoT' : 'Alternar status'"
            block
            class="col-span-2 col-start-2 md:order-3 md:col-span-1 md:col-start-auto"
            @click="emit('toggle', spot)"
          />

          <div
            class="col-span-2 col-start-2 min-w-0 text-sm md:order-4 md:col-span-1 md:col-start-auto"
            :class="spot.type !== 'physical' && 'hidden md:block'"
          >
            <button
              v-if="spot.type === 'physical'"
              type="button"
              class="flex w-full min-w-0 items-center gap-2 rounded-[var(--ss-radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--ss-glass-border)]"
              @click="emit('manageDevice', spot)"
            >
              <UIcon
                name="i-lucide-cpu"
                class="size-4 shrink-0"
                :class="devices.get(spot.id)?.is_active ? 'text-[var(--ss-neon)]' : 'text-[var(--ss-text-muted)]'"
              />
              <span v-if="devices.get(spot.id)" class="truncate">
                {{ devices.get(spot.id)!.device_identifier }}
                <span class="text-[var(--ss-text-muted)]">· {{ formatRelativeTime(devices.get(spot.id)!.last_seen_at) }}</span>
              </span>
              <span v-else class="truncate text-[var(--ss-text-muted)] underline underline-offset-4">Vincular dispositivo</span>
            </button>
            <span v-else class="px-2 text-[var(--ss-text-muted)]">—</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
