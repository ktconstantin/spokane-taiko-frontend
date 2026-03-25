export const DUES_START_MONTH = '2026-03'
export const DUES_MONTHLY_AMOUNT = 20

function parseMonthParts(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return { year, month }
}

export function normalizeMonthKey(value) {
  if (!value) return null

  if (typeof value === 'string') {
    const monthMatch = value.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)
    if (monthMatch) return `${monthMatch[1]}-${monthMatch[2]}`
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) return null

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function monthKeyToDate(monthKey) {
  const { year, month } = parseMonthParts(monthKey)
  return new Date(Date.UTC(year, month - 1, 1))
}

export function monthKeyToStorageValue(monthKey) {
  return `${monthKey}-01`
}

export function formatMonthLabel(monthKey, locale = 'en-US') {
  return monthKeyToDate(monthKey).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function compareMonthKeys(a, b) {
  return a.localeCompare(b)
}

export function sortMonthKeys(monthKeys) {
  return [...monthKeys].sort(compareMonthKeys)
}

export function addMonths(monthKey, count) {
  const date = monthKeyToDate(monthKey)
  date.setUTCMonth(date.getUTCMonth() + count)
  return normalizeMonthKey(date)
}

export function buildMonthRange(startMonth = DUES_START_MONTH, endMonth) {
  const normalizedStart = normalizeMonthKey(startMonth)
  const normalizedEnd = normalizeMonthKey(endMonth)

  if (!normalizedStart || !normalizedEnd || normalizedStart > normalizedEnd) return []

  const months = []
  let current = normalizedStart

  while (current <= normalizedEnd) {
    months.push(current)
    current = addMonths(current, 1)
  }

  return months
}

export function getCurrentMonthKey() {
  return normalizeMonthKey(new Date())
}

export function buildAdminMonthOptions() {
  return buildMonthRange(DUES_START_MONTH, addMonths(getCurrentMonthKey(), 12))
}

export function getNextDueMonth(paidMonthKeys, startMonth = DUES_START_MONTH) {
  const paidSet = new Set(paidMonthKeys.map(normalizeMonthKey).filter(Boolean))
  const latestMonth = addMonths(getCurrentMonthKey(), 12)
  const months = buildMonthRange(startMonth, latestMonth)

  return months.find((monthKey) => !paidSet.has(monthKey)) || null
}
