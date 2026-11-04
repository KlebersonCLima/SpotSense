<script setup lang="ts">
const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex min-h-dvh">
    <AppSidebar v-model:open="sidebarOpen" />

    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div class="mx-auto w-full max-w-7xl">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
