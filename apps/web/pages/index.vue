<script setup lang="ts">
useSeoMeta({ title: 'Dashboard · SpotSense' })

const { lots, status } = useParkingLots()

const activeLots = computed(() => lots.value.filter(lot => lot.is_active))
const stats = computed(() => summarizeSpots(activeLots.value.flatMap(lot => lot.spots)))
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Dashboard" description="Ocupação dos seus estacionamentos ativos, atualizada em tempo real." />

    <div v-if="status === 'pending' && !lots.length" class="grid gap-4 lg:grid-cols-3">
      <USkeleton class="h-56 rounded-[var(--ss-radius-lg)] lg:col-span-3" />
    </div>

    <EmptyState
      v-else-if="!lots.length"
      icon="i-lucide-square-parking"
      title="Nenhum estacionamento cadastrado"
    />

    <template v-else>
      <!-- destaque -->
      <div class="glass relative flex flex-col items-center gap-6 overflow-hidden rounded-[var(--ss-radius-lg)] p-6 sm:flex-row sm:p-8">
        <div class="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[var(--ss-neon)]/10 blur-3xl" aria-hidden="true" />
        <OccupancyRing :value="stats.occupancyRate" />
        <div class="relative space-y-2 text-center sm:text-left">
          <p class="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--ss-text-muted)] sm:justify-start">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-[var(--ss-neon)] opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-[var(--ss-neon)]" />
            </span>
            Ao vivo
          </p>
          <p class="text-4xl font-semibold tracking-tight sm:text-5xl">
            {{ stats.available }} <span class="text-2xl font-normal text-[var(--ss-text-muted)] sm:text-3xl">vagas livres agora</span>
          </p>
          <p class="text-[var(--ss-text-muted)]">
            {{ stats.occupied }} ocupadas em {{ activeLots.length }} {{ activeLots.length === 1 ? 'estacionamento ativo' : 'estacionamentos ativos' }}.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Estacionamentos ativos" :value="activeLots.length" icon="i-lucide-square-parking" :hint="`de ${lots.length} cadastrados`" />
        <StatCard label="Vagas totais" :value="stats.total" icon="i-lucide-grid-3x3" />
        <StatCard label="Ocupadas" :value="stats.occupied" icon="i-lucide-car" />
        <StatCard label="Sensores IoT" :value="stats.physical" icon="i-lucide-radio" highlight hint="vagas físicas monitoradas" />
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Ocupação por estacionamento</h2>
          <UButton to="/parking-lots" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right" label="Ver todos" size="sm" />
        </div>
        <EmptyState v-if="!activeLots.length" icon="i-lucide-power-off" title="Nenhum estacionamento ativo" />
        <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ParkingLotCard v-for="lot in activeLots" :key="lot.id" :lot="lot" :actions="false" />
        </div>
      </div>
    </template>
  </section>
</template>
