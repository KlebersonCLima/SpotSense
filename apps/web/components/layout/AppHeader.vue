<script setup lang="ts">
const { user, signOut } = useAuth()
</script>

<template>
  <!-- Fixo no topo, sólido. No desktop a logo fica no menu lateral. -->
  <header class="surface sticky top-0 z-20 h-14 border-x-0 border-t-0 pt-[env(safe-area-inset-top)] box-content">
    <div class="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
      <AppLogo class="lg:hidden" />
      <div class="flex-1" />
      <span v-if="user?.email" class="hidden truncate text-sm text-[var(--ss-text-muted)] sm:inline">
        {{ user.email }}
      </span>
      <UButton
        icon="i-lucide-log-out"
        color="neutral"
        variant="ghost"
        size="lg"
        aria-label="Sair"
        title="Sair"
        @click="signOut"
      />
    </div>
  </header>
</template>
