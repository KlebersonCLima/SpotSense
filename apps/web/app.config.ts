export default defineAppConfig({
  ui: {
    colors: {
      primary: 'neon',
      neutral: 'neutral',
    },
    // Texto sempre escuro (#101010) sobre o neon, nos dois temas
    button: {
      compoundVariants: [
        { color: 'primary', variant: 'solid', class: 'text-[var(--ss-accent-ink)] hover:bg-[var(--ss-neon)]/85 font-semibold' },
      ],
    },
    badge: {
      compoundVariants: [
        { color: 'primary', variant: 'solid', class: 'text-[var(--ss-accent-ink)]' },
      ],
    },
  },
})
