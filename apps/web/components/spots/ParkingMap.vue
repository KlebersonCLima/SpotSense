<script setup lang="ts">
import type { IotDevice, ParkingSpot } from '@spotsense/shared'

const props = withDefaults(defineProps<{
  spots: ParkingSpot[]
  devices?: Map<string, IotDevice>
  recentlyChanged?: Record<string, true>
}>(), { devices: () => new Map(), recentlyChanged: () => ({}) })

const emit = defineEmits<{ toggle: [spot: ParkingSpot] }>()

const SLOT_WIDTH = 64
const container = ref<HTMLElement | null>(null)
const perRow = ref(10)

// Ajusta a quantidade de vagas por fileira à largura disponível
let observer: ResizeObserver | null = null
onMounted(() => {
  if (!container.value) return
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    perRow.value = Math.min(14, Math.max(4, Math.floor((entry.contentRect.width - 32) / SLOT_WIDTH)))
  })
  observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())

/** Agrupa as vagas em blocos: fileira de cima + corredor + fileira de baixo. */
const blocks = computed(() => {
  const rows: ParkingSpot[][] = []
  for (let i = 0; i < props.spots.length; i += perRow.value) {
    rows.push(props.spots.slice(i, i + perRow.value))
  }
  const result: Array<{ top: ParkingSpot[], bottom: ParkingSpot[] }> = []
  for (let i = 0; i < rows.length; i += 2) {
    result.push({ top: rows[i] ?? [], bottom: rows[i + 1] ?? [] })
  }
  return result
})

const laneStyle = {
  backgroundImage: 'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.5) 0 18px, transparent 18px 36px)',
}
</script>

<template>
  <div class="space-y-4">
    <div
      ref="container"
      class="asphalt relative overflow-x-auto rounded-[var(--ss-radius-lg)] border border-white/10 p-4 sm:p-6"
    >
      <div class="mx-auto w-max space-y-2">
        <div v-for="(block, blockIndex) in blocks" :key="blockIndex">
          <!-- canteiro entre blocos -->
          <div
            v-if="blockIndex > 0"
            class="mb-2 h-2 rounded-full bg-white/[0.06]"
            aria-hidden="true"
          />

          <div class="flex">
            <ParkingSpotSlot
              v-for="spot in block.top"
              :key="spot.id"
              :spot="spot"
              side="top"
              :device="devices.get(spot.id)"
              :flash="Boolean(recentlyChanged[spot.id])"
              @toggle="emit('toggle', $event)"
            />
          </div>

          <!-- corredor -->
          <div class="relative h-14" aria-hidden="true">
            <div class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" :style="laneStyle" />
            <span
              v-if="blockIndex === 0"
              class="absolute -left-1 top-1/2 -translate-y-1/2 rounded bg-[var(--ss-neon)] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-[var(--ss-black)]"
            >
              ENTRADA
            </span>
            <span
              v-if="blockIndex === blocks.length - 1"
              class="absolute top-1/2 -translate-y-1/2 rounded border border-white/30 bg-[#161616] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white/70"
              :class="blockIndex % 2 === 0 ? '-right-1' : '-left-1'"
            >
              SAÍDA
            </span>
          </div>

          <div v-if="block.bottom.length" class="flex">
            <ParkingSpotSlot
              v-for="spot in block.bottom"
              :key="spot.id"
              :spot="spot"
              side="bottom"
              :device="devices.get(spot.id)"
              :flash="Boolean(recentlyChanged[spot.id])"
              @toggle="emit('toggle', $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- legenda -->
    <ul class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--ss-text-muted)]">
      <li class="flex items-center gap-2">
        <span class="grid h-5 w-4 place-items-center rounded-sm border border-white/30 bg-[#161616] text-[6px] font-bold text-[var(--ss-neon)]">P</span>
        Disponível
      </li>
      <li class="flex items-center gap-2">
        <CarTopView class="h-5 w-3" color="#d4d4d4" />
        Ocupada
      </li>
      <li class="flex items-center gap-2">
        <span class="relative flex size-2.5">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-[var(--ss-neon)] opacity-75" />
          <span class="relative inline-flex size-2.5 rounded-full bg-[var(--ss-neon)]" />
        </span>
        Física (sensor IoT)
      </li>
      <li class="flex items-center gap-2">
        <UIcon name="i-lucide-mouse-pointer-click" class="size-4" />
        Simuladas: clique para alternar
      </li>
    </ul>
  </div>
</template>

<style scoped>
.asphalt {
  background-color: #161616;
  background-image:
    radial-gradient(circle at 20% 10%, rgb(255 255 255 / 0.04), transparent 40%),
    radial-gradient(circle at 80% 90%, rgb(200 255 0 / 0.05), transparent 45%);
  box-shadow: inset 0 0 60px rgb(0 0 0 / 0.6), var(--ss-glass-shadow);
}
</style>
