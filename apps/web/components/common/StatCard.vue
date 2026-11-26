<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string | number
  icon: string
  hint?: string
  /** Destaca o valor com a cor neon. */
  highlight?: boolean
}>(), { hint: undefined, highlight: false })
</script>

<template>
  <div class="surface rounded-[var(--ss-radius-lg)] p-4">
    <p class="flex items-center gap-2 text-xs text-[var(--ss-text-muted)] sm:text-sm">
      <UIcon :name="icon" class="size-4 shrink-0" :class="highlight && 'text-[var(--ss-neon)]'" />
      <span class="truncate">{{ label }}</span>
    </p>
    <p class="mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl" :class="highlight && 'text-[var(--ss-neon)]'">
      {{ value }}
    </p>
    <p v-if="hint" class="mt-1 hidden truncate text-xs text-[var(--ss-text-muted)] sm:block">
      {{ hint }}
    </p>
  </div>
</template>
