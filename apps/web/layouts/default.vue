<template>
  <div class="min-h-dvh lg:flex">
    <!-- Desktop: menu lateral fixo -->
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />

      <!-- Celular: espaço no rodapé para a navegação inferior -->
      <main class="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
        <div class="mx-auto w-full max-w-7xl">
          <slot />
        </div>
      </main>
    </div>

    <!-- Celular: navegação inferior -->
    <NavegacaoInferior />
  </div>
</template>
