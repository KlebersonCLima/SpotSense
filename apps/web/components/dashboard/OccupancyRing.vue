<script setup lang="ts">
const props = defineProps<{
  /** Ocupação de 0 a 100. */
  value: number
}>()

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const offset = computed(() => CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, props.value)) / 100))
</script>

<template>
  <div class="relative size-28 shrink-0 sm:size-36" role="img" :aria-label="`Ocupação geral de ${value}%`">
    <svg viewBox="0 0 120 120" class="size-full -rotate-90">
      <circle cx="60" cy="60" :r="RADIUS" fill="none" stroke="var(--ss-glass-border)" stroke-width="10" />
      <circle
        cx="60"
        cy="60"
        :r="RADIUS"
        fill="none"
        stroke="var(--ss-neon)"
        stroke-width="10"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="offset"
        class="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
    <div class="absolute inset-0 grid place-items-center text-center">
      <div>
        <p class="text-2xl font-semibold tabular-nums sm:text-3xl">{{ value }}%</p>
        <p class="text-xs text-[var(--ss-text-muted)]">ocupação</p>
      </div>
    </div>
  </div>
</template>
