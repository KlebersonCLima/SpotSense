<script setup lang="ts">
import type { SpotHistoryWithSpot } from '~/services/parking-spots.service'

defineProps<{
  entries: SpotHistoryWithSpot[]
}>()
</script>

<template>
  <section class="glass flex flex-col rounded-[var(--ss-radius-lg)] p-5" aria-labelledby="activity-title">
    <h2 id="activity-title" class="mb-4 flex items-center gap-2 font-semibold">
      <span class="relative flex size-2">
        <span class="absolute inline-flex size-full animate-ping rounded-full bg-[var(--ss-neon)] opacity-75" />
        <span class="relative inline-flex size-2 rounded-full bg-[var(--ss-neon)]" />
      </span>
      Atividade em tempo real
    </h2>

    <p v-if="!entries.length" class="text-sm text-[var(--ss-text-muted)]">
      Nenhuma mudança registrada ainda. Clique em uma vaga simulada ou acione o sensor.
    </p>

    <TransitionGroup v-else tag="ol" name="feed" class="space-y-3">
      <li v-for="entry in entries" :key="entry.id" class="flex items-start gap-3 text-sm">
        <span
          class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg"
          :class="entry.source === 'iot' ? 'bg-[var(--ss-neon)] text-[var(--ss-black)]' : 'bg-[var(--ss-glass-border)]'"
          :title="entry.source === 'iot' ? 'Sensor IoT' : 'Manual'"
        >
          <UIcon :name="entry.source === 'iot' ? 'i-lucide-radio' : 'i-lucide-mouse-pointer-click'" class="size-4" />
        </span>
        <div class="min-w-0">
          <p>
            Vaga <strong class="font-mono">{{ String(entry.spot.spot_number).padStart(2, '0') }}</strong>
            ficou <strong>{{ entry.new_status === 'occupied' ? 'ocupada' : 'disponível' }}</strong>
          </p>
          <p class="text-xs text-[var(--ss-text-muted)]">
            {{ entry.source === 'iot' ? 'Sensor IoT' : 'Manual' }} · {{ formatRelativeTime(entry.created_at) }}
          </p>
        </div>
      </li>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.feed-enter-active {
  transition: all 400ms ease;
}

.feed-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
