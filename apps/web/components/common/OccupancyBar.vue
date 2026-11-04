<script setup lang="ts">
const props = defineProps<{
  occupied: number
  total: number
}>()

const rate = computed(() => (props.total ? Math.round((props.occupied / props.total) * 100) : 0))
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-xs text-[var(--ss-text-muted)]">
      <span>{{ occupied }} de {{ total }} ocupadas</span>
      <span class="font-medium tabular-nums text-[var(--ss-text)]">{{ rate }}%</span>
    </div>
    <div
      class="h-2 overflow-hidden rounded-full bg-[var(--ss-glass-border)]"
      role="progressbar"
      :aria-valuenow="rate"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`Ocupação de ${rate}%`"
    >
      <div
        class="h-full rounded-full bg-[var(--ss-neon)] shadow-[0_0_12px_rgb(200_255_0/0.6)] transition-[width] duration-500"
        :style="{ width: `${rate}%` }"
      />
    </div>
  </div>
</template>
