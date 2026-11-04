<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      color="neutral"
      variant="ghost"
      :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
      @click="toggleTheme"
    />
    <template #fallback>
      <div class="size-8" />
    </template>
  </ClientOnly>
</template>
