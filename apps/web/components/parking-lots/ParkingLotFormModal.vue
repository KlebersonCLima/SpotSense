<script setup lang="ts">
import { z } from 'zod'
import type { ParkingLot } from '@spotsense/shared'
import type { NewParkingLotInput } from '~/services/parking-lots.service'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(defineProps<{
  /** Estacionamento em edição; quando ausente, o modal cria um novo. */
  lot?: ParkingLot | null
  loading?: boolean
}>(), { lot: null, loading: false })

const emit = defineEmits<{ submit: [data: NewParkingLotInput] }>()

const isEditing = computed(() => Boolean(props.lot))

const baseSchema = z.object({
  name: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(120, 'Máximo de 120 caracteres.'),
  address: z.string().trim().max(255, 'Máximo de 255 caracteres.'),
  description: z.string().trim().max(500, 'Máximo de 500 caracteres.'),
  is_active: z.boolean(),
  spotCount: z.number({ error: 'Informe um número.' }).int().min(0),
  physicalSpotCount: z.number({ error: 'Informe um número.' }).int().min(0),
})

const createSchema = baseSchema
  .extend({
    spotCount: z.number({ error: 'Informe um número.' }).int().min(1, 'Mínimo de 1 vaga.').max(500, 'Máximo de 500 vagas.'),
  })
  .refine(data => data.physicalSpotCount <= data.spotCount, {
    message: 'Não pode passar do total de vagas.',
    path: ['physicalSpotCount'],
  })

const schema = computed(() => (isEditing.value ? baseSchema : createSchema))

type FormState = z.infer<typeof baseSchema>

function initialState(): FormState {
  return {
    name: props.lot?.name ?? '',
    address: props.lot?.address ?? '',
    description: props.lot?.description ?? '',
    is_active: props.lot?.is_active ?? true,
    spotCount: 20,
    physicalSpotCount: 1,
  }
}

const state = reactive<FormState>(initialState())

watch(open, (isOpen) => {
  if (isOpen) Object.assign(state, initialState())
})

function onSubmit() {
  emit('submit', { ...state })
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isEditing ? 'Editar estacionamento' : 'Novo estacionamento'"
    :description="isEditing ? 'Atualize as informações do estacionamento.' : 'Cadastre o estacionamento e gere as vagas automaticamente.'"
  >
    <template #body>
      <UForm id="parking-lot-form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nome" name="name" required>
          <UInput v-model="state.name" placeholder="Ex.: Estacionamento Central" class="w-full" autofocus />
        </UFormField>

        <UFormField label="Endereço" name="address">
          <UInput v-model="state.address" placeholder="Rua, número, bairro" icon="i-lucide-map-pin" class="w-full" />
        </UFormField>

        <UFormField label="Descrição" name="description">
          <UTextarea v-model="state.description" :rows="2" placeholder="Observações sobre o estacionamento" class="w-full" autoresize />
        </UFormField>

        <div v-if="!isEditing" class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Total de vagas" name="spotCount" required>
            <UInputNumber v-model="state.spotCount" :min="1" :max="500" class="w-full" />
          </UFormField>
          <UFormField label="Vagas físicas (IoT)" name="physicalSpotCount" help="As últimas vagas da numeração.">
            <UInputNumber v-model="state.physicalSpotCount" :min="0" :max="state.spotCount" class="w-full" />
          </UFormField>
        </div>

        <USwitch v-model="state.is_active" label="Estacionamento ativo" description="Estacionamentos inativos não aparecem no dashboard." />
      </UForm>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" label="Cancelar" @click="close" />
        <UButton
          type="submit"
          form="parking-lot-form"
          :label="isEditing ? 'Salvar alterações' : 'Criar estacionamento'"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>
