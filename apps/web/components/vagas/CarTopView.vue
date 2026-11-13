<script setup lang="ts">
/** Carro visto de cima (frente apontando para cima). */
withDefaults(defineProps<{
  color?: string
  /** Faixa neon no capô: identifica carros em vagas físicas (IoT). */
  accent?: boolean
}>(), { color: '#e5e5e5', accent: false })
</script>

<template>
  <svg viewBox="0 0 40 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- sombra -->
    <rect x="3" y="4" width="36" height="68" rx="11" fill="#000" opacity="0.45" />
    <!-- retrovisores -->
    <rect x="0" y="23" width="5" height="5" rx="2" :fill="color" />
    <rect x="35" y="23" width="5" height="5" rx="2" :fill="color" />
    <!-- carroceria -->
    <rect x="2" y="1" width="36" height="68" rx="11" :fill="color" />
    <rect x="2" y="1" width="36" height="68" rx="11" fill="url(#car-shine)" />
    <!-- faixa IoT -->
    <rect v-if="accent" x="17" y="1.5" width="6" height="67" rx="1" fill="#C8FF00" opacity="0.9" />
    <!-- para-brisa -->
    <path d="M7 21 Q20 15 33 21 L31 30 Q20 27 9 30 Z" fill="#101010" opacity="0.85" />
    <!-- teto -->
    <rect x="9.5" y="30" width="21" height="20" rx="4" :fill="color" />
    <rect x="9.5" y="30" width="21" height="20" rx="4" fill="#000" opacity="0.08" />
    <!-- vidro traseiro -->
    <path d="M9 50 Q20 53 31 50 L32 58 Q20 61 8 58 Z" fill="#101010" opacity="0.85" />
    <!-- faróis -->
    <rect x="6" y="2.5" width="8" height="3" rx="1.5" fill="#fff" opacity="0.95" />
    <rect x="26" y="2.5" width="8" height="3" rx="1.5" fill="#fff" opacity="0.95" />
    <!-- lanternas -->
    <rect x="6" y="65" width="8" height="2.5" rx="1" fill="#101010" opacity="0.55" />
    <rect x="26" y="65" width="8" height="2.5" rx="1" fill="#101010" opacity="0.55" />
    <defs>
      <linearGradient id="car-shine" x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#000" stop-opacity="0.18" />
        <stop offset="0.45" stop-color="#fff" stop-opacity="0.18" />
        <stop offset="1" stop-color="#000" stop-opacity="0.22" />
      </linearGradient>
    </defs>
  </svg>
</template>
