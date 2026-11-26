<script setup lang="ts">
import type { Dispositivo, Vaga, TipoVaga } from '@spotsense/shared'

const props = withDefaults(defineProps<{
  spots: Vaga[]
  devices?: Map<string, Dispositivo>
  nextSpotNumber: number
  adding?: boolean
}>(), { devices: () => new Map(), adding: false })

const emit = defineEmits<{
  add: [count: number, type: TipoVaga]
  toggle: [spot: Vaga]
  setType: [spot: Vaga, type: TipoVaga]
  remove: [spot: Vaga]
  manageDevice: [spot: Vaga]
}>()

const typeItems = [
  { label: 'Simulada', value: 'simulada' },
  { label: 'Física (IoT)', value: 'fisica' },
]

const newCount = ref<number | null>(1)
const newType = ref<TipoVaga>('simulada')

const count = computed(() => Math.min(200, Math.max(1, Math.floor(newCount.value ?? 1))))
const numberingHint = computed(() =>
  count.value > 1
    ? `Vagas ${props.nextSpotNumber} a ${props.nextSpotNumber + count.value - 1}`
    : `Vaga ${props.nextSpotNumber}`,
)

/** Colunas da lista no desktop (cabeçalho e linhas usam a mesma grade). */
const GRID = 'md:grid-cols-[4rem_12rem_10rem_minmax(0,1fr)_2.25rem]'
</script>

<template>
  <div class="space-y-4">
    <!-- adicionar vagas -->
    <div class="surface space-y-2 rounded-[var(--ss-radius-lg)] p-4">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:items-end">
        <UFormField label="Quantidade">
          <UInputNumber v-model="newCount" :min="1" :max="200" class="w-full" />
        </UFormField>
        <UFormField label="Tipo">
          <USelect v-model="newType" :items="typeItems" class="w-full" />
        </UFormField>
        <UButton icon="i-lucide-plus" :loading="adding" block class="col-span-2 sm:col-span-1" label="Adicionar vagas" @click="emit('add', count, newType)" />
      </div>
      <p class="text-xs text-[var(--ss-text-muted)]">
        Numeração: {{ numberingHint }}
      </p>
    </div>

    <EmptyState v-if="!spots.length" icon="i-lucide-grid-2x2" title="Nenhuma vaga cadastrada" />

    <!-- lista -->
    <div v-else class="surface overflow-hidden rounded-[var(--ss-radius-lg)]">
      <div
        class="hidden gap-4 border-b border-[var(--ss-glass-border)] px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--ss-text-muted)] md:grid"
        :class="GRID"
      >
        <span>Vaga</span>
        <span>Tipo</span>
        <span>Status</span>
        <span>Dispositivo</span>
        <span class="sr-only">Ações</span>
      </div>

      <ul class="divide-y divide-[var(--ss-glass-border)]">
        <li
          v-for="spot in spots"
          :key="spot.id"
          class="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-x-2 gap-y-1 px-3 py-2.5 md:gap-x-4 md:px-4 md:py-3"
          :class="GRID"
        >
          <span class="order-1 font-mono text-base font-semibold md:text-lg">{{ String(spot.numero).padStart(2, '0') }}</span>

          <USelect
            :model-value="spot.tipo"
            :items="typeItems"
            size="sm"
            class="order-2 w-full"
            :aria-label="`Tipo da vaga ${spot.numero}`"
            @update:model-value="(value) => emit('setType', spot, value as TipoVaga)"
          />

          <UButton
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            size="sm"
            class="order-4 justify-self-end md:order-5"
            :aria-label="`Excluir vaga ${spot.numero}`"
            @click="emit('remove', spot)"
          />

          <UButton
            :color="spot.situacao === 'ocupada' ? 'neutral' : 'primary'"
            :variant="spot.situacao === 'ocupada' ? 'solid' : 'soft'"
            :icon="spot.tipo === 'fisica' ? 'i-lucide-lock' : 'i-lucide-repeat'"
            :label="ROTULO_SITUACAO_VAGA[spot.situacao]"
            :disabled="spot.tipo === 'fisica'"
            :title="spot.tipo === 'fisica' ? 'Controlada pelo sensor IoT' : 'Alternar status'"
            block
            size="sm"
            class="order-3 md:order-3"
            @click="emit('toggle', spot)"
          />

          <div
            class="order-5 col-span-4 min-w-0 text-sm md:order-4 md:col-span-1"
            :class="spot.tipo !== 'fisica' && 'hidden md:block'"
          >
            <button
              v-if="spot.tipo === 'fisica'"
              type="button"
              class="flex w-full min-w-0 items-center gap-2 rounded-[var(--ss-radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--ss-glass-border)]"
              @click="emit('manageDevice', spot)"
            >
              <UIcon
                name="i-lucide-cpu"
                class="size-4 shrink-0"
                :class="devices.get(spot.id)?.ativo ? 'text-[var(--ss-neon)]' : 'text-[var(--ss-text-muted)]'"
              />
              <span v-if="devices.get(spot.id)" class="truncate">
                {{ devices.get(spot.id)!.identificador }}
                <span class="text-[var(--ss-text-muted)]">· {{ formatRelativeTime(devices.get(spot.id)!.ultimo_contato_em) }}</span>
              </span>
              <span v-else class="truncate text-[var(--ss-text-muted)] underline underline-offset-4">Vincular dispositivo</span>
            </button>
            <span v-else class="px-2 text-[var(--ss-text-muted)]">—</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
