<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Entrar · SpotSense' })

// Usuário já autenticado não precisa ver o login
const user = useSupabaseUser()
watch(user, (value) => {
  if (value) navigateTo('/')
}, { immediate: true })
</script>

<template>
  <div class="surface w-full max-w-sm space-y-8 rounded-[var(--ss-radius-lg)] p-6 sm:p-8">
    <AppLogo class="justify-center" />
    <LoginForm />
  </div>
</template>
