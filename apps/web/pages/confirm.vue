<script setup lang="ts">
// Callback do Supabase Auth: redireciona assim que a sessão é estabelecida
definePageMeta({ layout: 'auth' })

const user = useSupabaseUser()
watch(user, (value) => {
  if (value) navigateTo('/')
}, { immediate: true })
</script>

<template>
  <p class="text-[var(--ss-text-muted)]">Confirmando acesso…</p>
</template>
