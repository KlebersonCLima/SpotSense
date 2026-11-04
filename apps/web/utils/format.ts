const relativeTimeFormat = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
]

/** "há 5 minutos", "agora"… */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'nunca'
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000)
  if (Math.abs(seconds) < 10) return 'agora'
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds || unit === 'second') {
      return relativeTimeFormat.format(Math.round(seconds / unitSeconds), unit)
    }
  }
  return ''
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(date))
}
