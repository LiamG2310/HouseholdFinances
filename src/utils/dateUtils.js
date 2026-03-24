export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(date = new Date()) {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// Returns YYYY-MM-DD for a specific day in a given year/month (1-indexed month)
export function dateForDay(year, month, day) {
  const clamped = Math.min(day, daysInMonth(year, month - 1))
  return `${year}-${String(month).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(str) {
  if (!str) return ''
  return parseDate(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatShortDate(str) {
  if (!str) return ''
  return parseDate(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function daysUntil(str) {
  const target = parseDate(str)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target - now) / 86400000)
}
