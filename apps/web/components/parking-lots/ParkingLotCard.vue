<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ParkingLotWithSpots } from '~/services/parking-lots.service'

const props = withDefaults(defineProps<{
  lot: ParkingLotWithSpots
  /** Exibe o menu de ações (editar, ativar/desativar, excluir). */
  actions?: boolean
}>(), { actions: true })

const emit = defineEmits<{
  edit: [lot: ParkingLotWithSpots]
  toggleActive: [lot: ParkingLotWithSpots]
  remove: [lot: ParkingLotWithSpots]
}>()

const stats = computed(() => summarizeSpots(props.lot.spots))
const link = computed(() => `/parking-lots/${props.lot.id}`)

/** Mini mapa: até 40 pontinhos representando as vagas. */
const MAX_DOTS = 40
const dots = computed(() =>
  [...props.lot.spots]
    .sort((a, b) => Number(a.status === 'available') - Number(b.status === 'available'))
    .slice(0, MAX_DOTS),
)

const menuItems = computed<DropdownMenuItem[][]>(() => [
  [
    { label: 'Abrir painel', icon: 'i-lucide-layout-grid', to: link.value },
    { label: 'Editar', icon: 'i-lucide-pencil', onSelect: () => emit('edit', props.lot) },
    {
      label: props.lot.is_active ? 'Desativar' : 'Ativar',
      icon: props.lot.is_active ? 'i-lucide-power-off' : 'i-lucide-power',
      onSelect: () => emit('toggleActive', props.lot),
    },
  ],
  [{ label: 'Excluir', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('remove', props.lot) }],
])
</script>

<template>
  <article
    class="glass group relative flex flex-col gap-4 rounded-[var(--ss-radius-lg)] p-5 transition hover:-translate-y-0.5 hover:ring-1 hover:ring-[var(--ss-neon)]/40"
    :class="!lot.is_active && 'opacity-60'"
  >
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="mb-1 flex items-center gap-2">
          <span
            class="size-2 rounded-full"
            :class="lot.is_active ? 'bg-[var(--ss-neon)] shadow-[0_0_8px_rgb(200_255_0/0.9)]' : 'bg-[var(--ss-text-muted)]'"
            aria-hidden="true"
          />
          <span class="text-xs font-medium uppercase tracking-wider text-[var(--ss-text-muted)]">
            {{ lot.is_active ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
        <NuxtLink :to="link" class="block truncate text-lg font-semibold after:absolute after:inset-0 after:content-['']">
          {{ lot.name }}
        </NuxtLink>
        <p v-if="lot.address" class="mt-0.5 flex items-center gap-1 truncate text-sm text-[var(--ss-text-muted)]">
          <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
          {{ lot.address }}
        </p>
      </div>

      <UDropdownMenu v-if="actions" :items="menuItems" :content="{ align: 'end' }">
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="ghost"
          size="sm"
          class="relative z-10"
          :aria-label="`Ações de ${lot.name}`"
        />
      </UDropdownMenu>
    </header>

    <div class="flex flex-wrap gap-1" aria-hidden="true">
      <span
        v-for="spot in dots"
        :key="spot.id"
        class="h-3 w-2 rounded-[2px] transition-colors"
        :class="[
          spot.status === 'occupied' ? 'bg-[var(--ss-text)]/70' : 'bg-[var(--ss-neon)]/80',
          spot.type === 'physical' && 'ring-1 ring-offset-1 ring-[var(--ss-neon)] ring-offset-transparent',
        ]"
      />
      <span v-if="lot.spots.length > MAX_DOTS" class="text-[10px] leading-3 text-[var(--ss-text-muted)]">
        +{{ lot.spots.length - MAX_DOTS }}
      </span>
    </div>

    <OccupancyBar :occupied="stats.occupied" :total="stats.total" />

    <footer class="flex items-center gap-4 text-xs text-[var(--ss-text-muted)]">
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-circle-check" class="size-3.5" /> {{ stats.available }} livres
      </span>
      <span v-if="stats.physical" class="flex items-center gap-1">
        <UIcon name="i-lucide-radio" class="size-3.5" /> {{ stats.physical }} IoT
      </span>
    </footer>
  </article>
</template>
