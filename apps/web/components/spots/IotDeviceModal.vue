<script setup lang="ts">
import { z } from 'zod'
import type { IotDevice, ParkingSpot, RegisteredIotDevice } from '@spotsense/shared'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  spot: ParkingSpot | null
  device: IotDevice | null
  register: (spotId: string, identifier: string) => Promise<RegisteredIotDevice | null>
}>()

const emit = defineEmits<{
  setActive: [device: IotDevice, isActive: boolean]
  remove: [device: IotDevice]
}>()

const config = useRuntimeConfig()
const toast = useToast()

const schema = z.object({
  identifier: z.string().trim().regex(/^[A-Za-z0-9_-]{3,64}$/, 'Use de 3 a 64 caracteres: letras, números, "-" ou "_".'),
})

const state = reactive({ identifier: '' })
const loading = ref(false)
const credentials = ref<RegisteredIotDevice | null>(null)

const endpoint = computed(() => `${config.public.supabase.url}/functions/v1/iot-spot-status`)

const credentialItems = computed(() =>
  credentials.value
    ? [
        { label: 'Endpoint (API_ENDPOINT)', value: endpoint.value },
        { label: 'Identificador (DEVICE_ID)', value: credentials.value.device_identifier },
        { label: 'Token (DEVICE_TOKEN)', value: credentials.value.device_token },
      ]
    : [],
)

watch(open, (isOpen) => {
  if (!isOpen) return
  credentials.value = null
  state.identifier = props.device?.device_identifier ?? `esp32-vaga-${props.spot?.spot_number ?? ''}`
})

async function onSubmit() {
  if (!props.spot) return
  loading.value = true
  credentials.value = await props.register(props.spot.id, state.identifier.trim())
  loading.value = false
}

async function copy(value: string) {
  await navigator.clipboard.writeText(value)
  toast.add({ title: 'Copiado!', icon: 'i-lucide-copy-check' })
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Dispositivo IoT · Vaga ${spot?.spot_number ?? ''}`"
    description="O ESP32 usa o identificador e o token para enviar o estado da vaga."
  >
    <template #body>
      <!-- credenciais recém-geradas -->
      <div v-if="credentials" class="space-y-4">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-shield-alert"
          title="Copie o token agora"
          description="Por segurança ele não será exibido novamente. Gerar um novo token invalida o anterior."
        />
        <div v-for="item in credentialItems" :key="item.label" class="space-y-1">
          <p class="text-xs font-medium text-[var(--ss-text-muted)]">
            {{ item.label }}
          </p>
          <div class="flex items-center gap-2">
            <code
              class="min-w-0 flex-1 truncate rounded-[var(--ss-radius-sm)] bg-[var(--ss-glass-border)] px-3 py-2 font-mono text-xs"
              :data-credential="item.label"
            >{{ item.value }}</code>
            <UButton icon="i-lucide-copy" color="neutral" variant="ghost" :aria-label="`Copiar ${item.label}`" @click="copy(item.value)" />
          </div>
        </div>
      </div>

      <div v-else class="space-y-5">
        <div v-if="device" class="glass flex items-center justify-between gap-3 rounded-[var(--ss-radius-md)] p-4">
          <div class="min-w-0">
            <p class="truncate font-medium">{{ device.device_identifier }}</p>
            <p class="text-xs text-[var(--ss-text-muted)]">Última comunicação: {{ formatRelativeTime(device.last_seen_at) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <USwitch
              :model-value="device.is_active"
              :label="device.is_active ? 'Ativo' : 'Inativo'"
              @update:model-value="(value) => emit('setActive', device!, Boolean(value))"
            />
            <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" size="sm" aria-label="Remover dispositivo" @click="emit('remove', device)" />
          </div>
        </div>

        <UForm id="iot-device-form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Identificador do dispositivo" name="identifier" help="Será o DEVICE_ID no firmware do ESP32.">
            <UInput v-model="state.identifier" icon="i-lucide-cpu" class="w-full font-mono" />
          </UFormField>
        </UForm>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :label="credentials ? 'Concluir' : 'Cancelar'" @click="close" />
        <UButton
          v-if="!credentials"
          type="submit"
          form="iot-device-form"
          icon="i-lucide-key-round"
          :loading="loading"
          :label="device ? 'Gerar novo token' : 'Vincular e gerar token'"
        />
      </div>
    </template>
  </UModal>
</template>
