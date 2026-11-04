<script setup lang="ts">
import type { IotDevice, ParkingSpot } from '@spotsense/shared'

const props = withDefaults(defineProps<{
  spot: ParkingSpot
  /** Fileira de cima (abre para baixo) ou de baixo (abre para cima). */
  side: 'top' | 'bottom'
  device?: IotDevice | null
  flash?: boolean
}>(), { device: null, flash: false })

const emit = defineEmits<{ toggle: [spot: ParkingSpot] }>()

/** Tons neutros (paleta da marca) escolhidos de forma estável pelo número da vaga. */
const CAR_COLORS = ['#f5f5f5', '#d4d4d4', '#a3a3a3', '#737373', '#e5e5e5', '#525252', '#262626']

const isOccupied = computed(() => props.spot.status === 'occupied')
const isPhysical = computed(() => props.spot.type === 'physical')
const carColor = computed(() => CAR_COLORS[props.spot.spot_number % CAR_COLORS.length])
const label = computed(() => String(props.spot.spot_number).padStart(2, '0'))

const tooltip = computed(() => {
  const status = SPOT_STATUS_LABEL[props.spot.status]
  if (!isPhysical.value) return `Vaga ${label.value} · ${status} · clique para alternar`
  const sensor = props.device
    ? `sensor ${props.device.is_active ? 'ativo' : 'inativo'}, visto ${formatRelativeTime(props.device.last_seen_at)}`
    : 'sem dispositivo vinculado'
  return `Vaga ${label.value} · ${status} · física (${sensor})`
})
</script>

<template>
  <UTooltip :text="tooltip" :delay-duration="150">
    <button
      type="button"
      class="spot relative h-24 w-16 shrink-0 border-white/40 outline-none transition-colors first:border-l-2 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--ss-neon)]"
      :class="[
        side === 'top' ? 'border-r-2 border-t-2' : 'border-b-2 border-r-2',
        isPhysical ? 'cursor-help' : 'cursor-pointer hover:bg-white/5',
        flash && 'spot-flash',
      ]"
      :aria-label="tooltip"
      :aria-pressed="isPhysical ? undefined : isOccupied"
      @click="emit('toggle', spot)"
    >
      <!-- piso da vaga física: contorno tracejado neon -->
      <span
        v-if="isPhysical"
        class="pointer-events-none absolute inset-1.5 rounded-md border border-dashed border-[var(--ss-neon)]/60"
        aria-hidden="true"
      />

      <!-- brilho de vaga livre -->
      <span
        v-if="!isOccupied"
        class="pointer-events-none absolute inset-2 rounded-md opacity-80"
        style="background: radial-gradient(circle at center, rgb(200 255 0 / 0.16), transparent 70%)"
        aria-hidden="true"
      />

      <!-- número pintado no chão, do lado do corredor -->
      <span
        class="absolute left-1/2 -translate-x-1/2 font-mono text-[11px] font-semibold tracking-wider text-white/55"
        :class="side === 'top' ? 'bottom-1' : 'top-1'"
      >
        {{ label }}
      </span>

      <Transition :name="side === 'top' ? 'car-from-bottom' : 'car-from-top'">
        <CarTopView
          v-if="isOccupied"
          :color="carColor"
          :accent="isPhysical"
          class="absolute left-1/2 w-9 -translate-x-1/2 drop-shadow-[0_6px_6px_rgb(0_0_0/0.5)]"
          :class="side === 'top' ? 'top-1.5' : 'bottom-1.5 rotate-180'"
        />
      </Transition>

      <span
        v-if="!isOccupied"
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold tracking-[0.2em] text-[var(--ss-neon)]"
      >
        LIVRE
      </span>

      <!-- sensor IoT -->
      <span
        v-if="isPhysical"
        class="absolute flex size-2.5"
        :class="side === 'top' ? 'right-1.5 top-1.5' : 'bottom-1.5 right-1.5'"
        aria-hidden="true"
      >
        <span
          v-if="!device || device.is_active"
          class="absolute inline-flex size-full animate-ping rounded-full bg-[var(--ss-neon)] opacity-75"
        />
        <span
          class="relative inline-flex size-2.5 rounded-full"
          :class="device?.is_active === false ? 'bg-white/40' : 'bg-[var(--ss-neon)]'"
        />
      </span>
    </button>
  </UTooltip>
</template>

<style scoped>
.car-from-bottom-enter-active,
.car-from-bottom-leave-active,
.car-from-top-enter-active,
.car-from-top-leave-active {
  transition: translate 450ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease;
}

/* Tailwind v4 posiciona com a propriedade `translate`; a animação usa a mesma propriedade */
.car-from-bottom-enter-from,
.car-from-bottom-leave-to {
  opacity: 0;
  translate: -50% 60%;
}

.car-from-top-enter-from,
.car-from-top-leave-to {
  opacity: 0;
  translate: -50% -60%;
}

@media (prefers-reduced-motion: reduce) {
  .car-from-bottom-enter-active,
  .car-from-bottom-leave-active,
  .car-from-top-enter-active,
  .car-from-top-leave-active {
    transition: none;
  }
}
</style>
