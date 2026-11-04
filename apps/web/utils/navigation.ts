import type { NavigationMenuItem } from '@nuxt/ui'

/** Itens da navegação principal (sidebar). */
export const mainNavigation: NavigationMenuItem[] = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Estacionamentos', icon: 'i-lucide-square-parking', to: '/parking-lots' },
]
