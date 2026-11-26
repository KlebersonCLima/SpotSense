<script setup lang="ts">
// Retorno do link de confirmação de e-mail: entra assim que a sessão é estabelecida.
definePageMeta({ layout: 'auth' })

const user = useSupabaseUser()
const demorou = ref(false)

watch(user, (value) => {
  if (value) navigateTo('/')
}, { immediate: true })

// Se o link foi aberto em outro aparelho/navegador, a sessão não é criada sozinha.
// O e-mail já está confirmado: basta entrar com e-mail e senha.
onMounted(() => {
  setTimeout(() => {
    demorou.value = true
  }, 6000)
})
</script>

<template>
  <div class="surface w-full max-w-sm space-y-4 rounded-[var(--ss-radius-lg)] p-6 text-center sm:p-8" role="status">
    <template v-if="!demorou">
      <UIcon name="i-lucide-loader-circle" class="mx-auto size-8 animate-spin text-[var(--ss-neon)]" />
      <p class="text-[var(--ss-text-muted)]">
        Confirmando seu e-mail…
      </p>
    </template>
    <template v-else>
      <UIcon name="i-lucide-mail-check" class="mx-auto size-8 text-[var(--ss-neon)]" />
      <h1 class="text-lg font-semibold">
        E-mail confirmado
      </h1>
      <p class="text-sm text-[var(--ss-text-muted)]">
        Agora é só entrar com o seu e-mail e a sua senha.
      </p>
      <UButton to="/login" block label="Ir para o login" />
    </template>
  </div>
</template>
