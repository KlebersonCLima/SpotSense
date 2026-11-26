<script setup lang="ts">
const route = useRoute()

// "/" só está ativo na própria página; as demais, também nas subpáginas
function ativo(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

const itens = mainNavigation.map(item => ({
  rotulo: String(item.label),
  icone: String(item.icon),
  to: String(item.to),
}))
</script>

<template>
  <!-- Somente no celular: navegação fixa no rodapé, ao alcance do polegar. -->
  <nav
    class="surface fixed inset-x-0 bottom-0 z-30 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
    aria-label="Navegação principal"
  >
    <ul class="grid grid-cols-2">
      <li v-for="item in itens" :key="item.to">
        <NuxtLink
          :to="item.to"
          class="flex h-14 flex-col items-center justify-center gap-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ss-neon)]"
          :class="ativo(item.to) ? 'text-[var(--ss-neon)]' : 'text-[var(--ss-text-muted)]'"
          :aria-current="ativo(item.to) ? 'page' : undefined"
        >
          <UIcon :name="item.icone" class="size-5" />
          {{ item.rotulo }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
