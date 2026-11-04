<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: () => (isNotFound.value ? 'Página não encontrada · SpotSense' : 'Erro · SpotSense') })

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <UApp>
    <div class="flex min-h-dvh items-center justify-center p-4">
      <div class="glass w-full max-w-sm space-y-4 rounded-[var(--ss-radius-lg)] p-8 text-center">
        <p class="font-mono text-5xl font-semibold text-[var(--ss-neon)]">
          {{ error.statusCode }}
        </p>
        <p class="font-medium">
          {{ isNotFound ? (error.statusMessage || 'Página não encontrada') : 'Algo deu errado' }}
        </p>
        <UButton label="Voltar ao início" icon="i-lucide-arrow-left" block @click="goHome" />
      </div>
    </div>
  </UApp>
</template>
