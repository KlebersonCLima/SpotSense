<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const route = useRoute()
watch(() => route.fullPath, () => {
  open.value = false
})
</script>

<template>
  <!-- Overlay no mobile -->
  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-black/40 lg:hidden"
    aria-hidden="true"
    @click="open = false"
  />

  <aside
    class="glass fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 p-4 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Navegação principal"
  >
    <AppLogo class="px-2 pt-2" />
    <UNavigationMenu :items="mainNavigation" orientation="vertical" />
  </aside>
</template>
