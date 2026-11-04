<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})
type Schema = z.output<typeof schema>

const mode = ref<'signin' | 'signup'>('signin')
const isSignUp = computed(() => mode.value === 'signup')

const state = reactive<Partial<Schema>>({ email: '', password: '' })
const loading = ref(false)
const errorMessage = ref('')

const { signIn, signUp } = useAuth()
const toast = useToast()

function toggleMode() {
  mode.value = isSignUp.value ? 'signin' : 'signup'
  errorMessage.value = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  errorMessage.value = ''
  try {
    if (isSignUp.value) {
      const hasSession = await signUp(event.data)
      if (!hasSession) {
        toast.add({ title: 'Conta criada', description: 'Confirme seu e-mail para entrar.', icon: 'i-lucide-mail' })
        mode.value = 'signin'
        return
      }
    }
    else {
      await signIn(event.data)
    }
    await navigateTo('/')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erro inesperado.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1 text-center">
      <h1 class="text-xl font-semibold">
        {{ isSignUp ? 'Criar conta' : 'Entrar' }}
      </h1>
      <p class="text-sm text-[var(--ss-text-muted)]">
        {{ isSignUp ? 'Cadastre-se para gerenciar seus estacionamentos.' : 'Acesse o painel do SpotSense.' }}
      </p>
    </div>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="E-mail" name="email">
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          placeholder="voce@exemplo.com"
          icon="i-lucide-mail"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Senha" name="password">
        <UInput
          v-model="state.password"
          type="password"
          :autocomplete="isSignUp ? 'new-password' : 'current-password'"
          placeholder="••••••••"
          icon="i-lucide-lock"
          class="w-full"
        />
      </UFormField>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :description="errorMessage"
      />

      <UButton
        type="submit"
        block
        :loading="loading"
        class="font-semibold text-[var(--ss-accent-ink)]"
      >
        {{ isSignUp ? 'Criar conta' : 'Entrar' }}
      </UButton>
    </UForm>

    <p class="text-center text-sm text-[var(--ss-text-muted)]">
      {{ isSignUp ? 'Já tem conta?' : 'Ainda não tem conta?' }}
      <button
        type="button"
        class="font-medium text-[var(--ss-text)] underline-offset-4 hover:underline"
        @click="toggleMode"
      >
        {{ isSignUp ? 'Entrar' : 'Criar conta' }}
      </button>
    </p>
  </div>
</template>
