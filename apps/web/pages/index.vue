<script setup lang="ts">
useSeoMeta({ title: 'Dashboard · SpotSense' })

const { lots, status } = useEstacionamentos()

const activeLots = computed(() => lots.value.filter(lot => lot.ativo))
const stats = computed(() => resumirVagas(activeLots.value.flatMap(lot => lot.spots)))
</script>

<template>
  <section class="space-y-5 sm:space-y-6">
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
      <div class="surface flex items-center gap-4 rounded-[var(--ss-radius-lg)] p-4 sm:gap-8 sm:p-8">
        <OccupancyRing :value="stats.occupancyRate" />
        <div class="min-w-0 space-y-1 sm:space-y-2">
          <p class="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--ss-text-muted)]">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-[var(--ss-neon)] opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-[var(--ss-neon)]" />
            </span>
            Ao vivo
          </p>
          <p class="text-3xl font-semibold tracking-tight sm:text-5xl">
            {{ stats.available }} <span class="text-base font-normal text-[var(--ss-text-muted)] sm:text-3xl">livres agora</span>
          </p>
          <p class="text-sm text-[var(--ss-text-muted)] sm:text-base">
            {{ stats.occupied }} ocupadas em {{ activeLots.length }} {{ activeLots.length === 1 ? 'estacionamento ativo' : 'estacionamentos ativos' }}.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Ativos" :value="activeLots.length" icon="i-lucide-square-parking" :hint="`de ${lots.length} cadastrados`" />
        <StatCard label="Vagas totais" :value="stats.total" icon="i-lucide-grid-3x3" />
        <StatCard label="Ocupadas" :value="stats.occupied" icon="i-lucide-car" />
        <StatCard label="Sensores IoT" :value="stats.physical" icon="i-lucide-radio" highlight hint="vagas físicas monitoradas" />
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold sm:text-lg">Por estacionamento</h2>
          <UButton to="/estacionamentos" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right" label="Ver todos" size="sm" />
        </div>
        <EmptyState v-if="!activeLots.length" icon="i-lucide-power-off" title="Nenhum estacionamento ativo" />
        <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <EstacionamentoCard v-for="lot in activeLots" :key="lot.id" :lot="lot" :actions="false" />
        </div>
      </div>
    </template>
  </section>
</template>
