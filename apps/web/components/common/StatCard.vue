<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string | number
  icon: string
  hint?: string
  /** Destaca o card com a cor neon. */
  highlight?: boolean
}>(), { hint: undefined, highlight: false })
</script>

<template>
  <div
    class="glass relative overflow-hidden rounded-[var(--ss-radius-lg)] p-5"
    :class="highlight && 'ring-1 ring-[var(--ss-neon)]/40'"
  >
    <div
      v-if="highlight"
      class="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[var(--ss-neon)]/20 blur-2xl"
      aria-hidden="true"
    />
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm text-[var(--ss-text-muted)]">
        {{ label }}
      </p>
      <span
        class="grid size-9 place-items-center rounded-xl"
        :class="highlight ? 'bg-[var(--ss-neon)] text-[var(--ss-black)]' : 'bg-[var(--ss-glass-border)]'"
      >
        <UIcon :name="icon" class="size-5" />
      </span>
    </div>
    <p class="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
      {{ value }}
    </p>
    <p v-if="hint" class="mt-1 text-xs text-[var(--ss-text-muted)]">
      {{ hint }}
    </p>
  </div>
</template>
