<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 rounded-[var(--ss-radius-lg)] border border-dashed border-[var(--ss-glass-border)] px-6 py-16 text-center">
    <UIcon :name="icon" class="size-8 text-[var(--ss-text-muted)]" />
    <p class="font-medium">
      {{ title }}
    </p>
    <p v-if="description" class="max-w-sm text-sm text-[var(--ss-text-muted)]">
      {{ description }}
    </p>
  </div>
</template>
