<template>
  <!-- Notificações no topo: no celular o rodapé é ocupado pela navegação inferior -->
  <UApp :toaster="{ position: 'top-center' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
