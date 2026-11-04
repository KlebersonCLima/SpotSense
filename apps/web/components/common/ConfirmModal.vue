<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

withDefaults(defineProps<{
  title: string
  description?: string
  confirmLabel?: string
  loading?: boolean
}>(), { description: undefined, confirmLabel: 'Excluir', loading: false })

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" label="Cancelar" @click="close" />
        <UButton color="error" :label="confirmLabel" :loading="loading" @click="emit('confirm')" />
      </div>
    </template>
  </UModal>
</template>
