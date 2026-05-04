export function parseDateOnlyAsLocalDate(value) {
  if (!value || typeof value !== 'string') return null

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export function formatDateOnly(value, locale = 'en-US', options = {}) {
  const date = parseDateOnlyAsLocalDate(value)
  if (!date) return value || ''

  return date.toLocaleDateString(locale, options)
}
