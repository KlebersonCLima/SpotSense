<template>
  <!-- Somente no desktop; no celular a navegação é a barra inferior. -->
  <aside
    class="surface sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-y-0 border-l-0 p-4 lg:flex"
    aria-label="Navegação principal"
  >
    <AppLogo class="px-2 pt-2" />
    <UNavigationMenu :items="mainNavigation" orientation="vertical" />
  </aside>
</template>
