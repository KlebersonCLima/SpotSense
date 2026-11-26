<template>
  <div class="min-h-dvh lg:flex">
    <a
      href="#conteudo"
      class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[var(--ss-neon)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--ss-black)]"
    >
      Pular para o conteúdo
    </a>

    <!-- Desktop: menu lateral fixo -->
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />

      <!-- Celular: espaço no rodapé para a navegação inferior -->
      <main id="conteudo" tabindex="-1" class="flex-1 outline-none px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
        <div class="mx-auto w-full max-w-7xl">
          <slot />
        </div>
      </main>
    </div>

    <!-- Celular: navegação inferior -->
    <NavegacaoInferior />
  </div>
</template>
