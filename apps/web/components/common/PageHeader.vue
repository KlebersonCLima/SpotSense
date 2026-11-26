<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex items-start justify-between gap-3 sm:items-center">
    <div class="min-w-0 space-y-1">
      <slot name="eyebrow" />
      <h1 class="truncate text-xl font-semibold tracking-tight sm:text-3xl">
        {{ title }}
      </h1>
      <p v-if="description" class="hidden text-[var(--ss-text-muted)] sm:block">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
