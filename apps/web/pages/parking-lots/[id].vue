<script setup lang="ts">
const route = useRoute()
const parkingLotId = computed(() => String(route.params.id))

useSeoMeta({ title: 'Estacionamento · SpotSense' })
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl font-semibold">Estacionamento</h1>
      <p class="text-[var(--ss-text-muted)]">ID: {{ parkingLotId }}</p>
    </header>
  </section>
</template>
