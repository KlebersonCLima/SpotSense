<script setup lang="ts">
import type { NovoEstacionamentoInput, EstacionamentoComVagas } from '~/services/estacionamentos.service'

useSeoMeta({ title: 'Estacionamentos · SpotSense' })

const { lots, status, create, update, setActive, remove } = useEstacionamentos()

type Filter = 'all' | 'active' | 'inactive'
const filter = ref<Filter>('all')
const search = ref('')

const counts = computed(() => ({
  all: lots.value.length,
  active: lots.value.filter(lot => lot.ativo).length,
  inactive: lots.value.filter(lot => !lot.ativo).length,
}))

const tabs = computed(() => [
  { label: `Todos (${counts.value.all})`, value: 'all' },
  { label: `Ativos (${counts.value.active})`, value: 'active' },
  { label: `Inativos (${counts.value.inactive})`, value: 'inactive' },
])

const filteredLots = computed(() => {
  const term = search.value.trim().toLowerCase()
  return lots.value.filter((lot) => {
    if (filter.value === 'active' && !lot.ativo) return false
    if (filter.value === 'inactive' && lot.ativo) return false
    if (!term) return true
    return [lot.nome, lot.endereco, lot.descricao].some(value => value?.toLowerCase().includes(term))
  })
})

// Formulário (criar/editar)
const formOpen = ref(false)
const editingLot = ref<EstacionamentoComVagas | null>(null)
const saving = ref(false)

function openCreate() {
  editingLot.value = null
  formOpen.value = true
}

function openEdit(lot: EstacionamentoComVagas) {
  editingLot.value = lot
  formOpen.value = true
}

async function onSubmit(data: NovoEstacionamentoInput) {
  saving.value = true
  if (editingLot.value) {
    const { nome, endereco, descricao, ativo } = data
    const updated = await update(editingLot.value.id, { nome, endereco, descricao, ativo })
    if (updated) formOpen.value = false
  }
  else {
    const created = await create(data)
    if (created) {
      formOpen.value = false
      await navigateTo(`/estacionamentos/${created.id}`)
    }
  }
  saving.value = false
}

// Exclusão
const lotToDelete = ref<EstacionamentoComVagas | null>(null)
const confirmOpen = ref(false)
const deleting = ref(false)

function askRemove(lot: EstacionamentoComVagas) {
  lotToDelete.value = lot
  confirmOpen.value = true
}

async function confirmRemove() {
  if (!lotToDelete.value) return
  deleting.value = true
  await remove(lotToDelete.value.id)
  deleting.value = false
  confirmOpen.value = false
}
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Estacionamentos" description="Cadastre, organize e acompanhe todos os seus estacionamentos.">
      <template #actions>
        <UButton icon="i-lucide-plus" label="Novo estacionamento" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <UTabs v-model="filter" :items="tabs" :content="false" size="sm" class="w-full sm:w-auto" :ui="{ list: 'h-9' }" />
      <UInput v-model="search" icon="i-lucide-search" placeholder="Buscar por nome ou endereço" class="w-full sm:w-72" :ui="{ base: 'h-9' }" />
    </div>

    <div v-if="status === 'pending' && !lots.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <USkeleton v-for="n in 3" :key="n" class="h-56 rounded-[var(--ss-radius-lg)]" />
    </div>

    <EmptyState
      v-else-if="!lots.length"
      icon="i-lucide-square-parking"
      title="Nenhum estacionamento cadastrado"
    />

    <EmptyState
      v-else-if="!filteredLots.length"
      icon="i-lucide-search-x"
      title="Nenhum estacionamento encontrado"
    />

    <TransitionGroup v-else tag="div" name="list" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <EstacionamentoCard
        v-for="lot in filteredLots"
        :key="lot.id"
        :lot="lot"
        @edit="openEdit"
        @toggle-active="setActive($event.id, !$event.ativo)"
        @remove="askRemove"
      />
    </TransitionGroup>

    <EstacionamentoFormModal v-model:open="formOpen" :lot="editingLot" :loading="saving" @submit="onSubmit" />

    <ConfirmModal
      v-model:open="confirmOpen"
      :title="`Excluir ${lotToDelete?.nome ?? 'estacionamento'}?`"
      description="Todas as vagas, dispositivos IoT e o histórico deste estacionamento serão excluídos. Essa ação não pode ser desfeita."
      :loading="deleting"
      @confirm="confirmRemove"
    />
  </section>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 250ms ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
