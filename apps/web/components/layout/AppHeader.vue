<script setup lang="ts">
defineEmits<{ toggleSidebar: [] }>()
</script>

<template>
  <header class="glass sticky top-0 z-20 flex h-16 items-center gap-3 border-x-0 border-t-0 px-4 sm:px-6">
    <UButton
      icon="i-lucide-menu"
      color="neutral"
      variant="ghost"
      class="lg:hidden"
      aria-label="Abrir menu"
      @click="$emit('toggleSidebar')"
    />
    <div class="flex-1" />
    <ThemeToggle />
  </header>
</template>
