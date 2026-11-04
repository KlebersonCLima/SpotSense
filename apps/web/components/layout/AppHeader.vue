<script setup lang="ts">
defineEmits<{ toggleSidebar: [] }>()

const { user, signOut } = useAuth()
</script>

<template>
  <header class="glass sticky top-0 z-20 h-16 border-x-0 border-t-0">
    <div class="mx-auto flex h-full w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        class="lg:hidden"
        aria-label="Abrir menu"
        @click="$emit('toggleSidebar')"
      />
      <div class="flex-1" />
      <span v-if="user?.email" class="hidden truncate text-sm text-[var(--ss-text-muted)] sm:inline">
        {{ user.email }}
      </span>
      <UButton
        icon="i-lucide-log-out"
        color="neutral"
        variant="ghost"
        aria-label="Sair"
        title="Sair"
        @click="signOut"
      />
    </div>
  </header>
</template>
