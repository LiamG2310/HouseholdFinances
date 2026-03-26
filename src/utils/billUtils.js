import { dateForDay, parseDate } from './dateUtils.js'

// Normalise any frequency to a monthly equivalent amount
// Pass the full bill object as third arg to handle 'custom' months correctly
export function toMonthly(amount, frequency, bill = null) {
  switch (frequency) {
    case 'weekly':      return (amount * 52) / 12
    case 'fortnightly': return (amount * 26) / 12
    case 'monthly':     return amount
    case 'quarterly':   return amount / 3
    case '6-monthly':   return amount / 6
    case 'annual':      return amount / 12
    case 'one-off':     return amount
    case 'custom': {
      const months = bill?.activeMonths?.length || 12
      return (amount * months) / 12
    }
    default:            return amount
  }
}

// Given a bill definition, return the due date string for a given year+month (1-indexed),
// or null if the bill doesn't occur that month.
export function getBillOccurrence(bill, year, month) {
  if (!bill.active) return null

  const { frequency, dayOfMonth, nextDueDate } = bill

  if (frequency === 'one-off') {
    if (!nextDueDate) return null
    const [y, m] = nextDueDate.split('-').map(Number)
    return y === year && m === month ? nextDueDate : null
  }

  if (frequency === 'monthly') {
    return dateForDay(year, month, dayOfMonth || 1)
  }

  if (frequency === 'weekly' || frequency === 'fortnightly') {
    if (!nextDueDate) return null
    const intervalDays = frequency === 'weekly' ? 7 : 14
    const start = parseDate(nextDueDate)
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0)

    // Walk from nextDueDate and find the first occurrence in the target month
    let cursor = new Date(start)
    // Rewind to before month start if needed
    while (cursor > monthStart) {
      cursor = new Date(cursor.getTime() - intervalDays * 86400000)
    }
    // Forward until we hit the month or pass it
    while (cursor < monthStart) {
      cursor = new Date(cursor.getTime() + intervalDays * 86400000)
    }
    if (cursor <= monthEnd) {
      return cursor.toISOString().slice(0, 10)
    }
    return null
  }

  if (frequency === 'quarterly') {
    if (!nextDueDate) return null
    const [ny, nm] = nextDueDate.split('-').map(Number)
    const diff = (year * 12 + month) - (ny * 12 + nm)
    if (diff >= 0 && diff % 3 === 0) {
      return dateForDay(year, month, parseDate(nextDueDate).getDate())
    }
    return null
  }

  if (frequency === '6-monthly') {
    if (!nextDueDate) return null
    const [ny, nm] = nextDueDate.split('-').map(Number)
    const diff = (year * 12 + month) - (ny * 12 + nm)
    if (diff >= 0 && diff % 6 === 0) {
      return dateForDay(year, month, parseDate(nextDueDate).getDate())
    }
    return null
  }

  if (frequency === 'annual') {
    if (!nextDueDate) return null
    const [ny, nm] = nextDueDate.split('-').map(Number)
    if (nm === month) {
      return dateForDay(year, month, parseDate(nextDueDate).getDate())
    }
    return null
  }

  if (frequency === 'custom') {
    const activeMonths = bill.activeMonths || []
    if (!activeMonths.includes(month)) return null
    return dateForDay(year, month, bill.dayOfMonth || 1)
  }

  return null
}

// Returns all bill occurrences for a given month as { bill, dueDate } objects
export function getBillsForMonth(bills, year, month) {
  const result = []
  for (const bill of bills) {
    const dueDate = getBillOccurrence(bill, year, month)
    if (dueDate) result.push({ bill, dueDate })
  }
  return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export const CATEGORIES = [
  { value: 'housing',       label: 'Housing',       icon: '🏠' },
  { value: 'utilities',     label: 'Utilities',      icon: '⚡' },
  { value: 'subscriptions', label: 'Subscriptions',  icon: '📺' },
  { value: 'insurance',     label: 'Insurance',      icon: '🛡️' },
  { value: 'transport',     label: 'Transport',      icon: '🚗' },
  { value: 'food',          label: 'Food',           icon: '🛒' },
  { value: 'health',        label: 'Health',         icon: '💊' },
  { value: 'other',         label: 'Other',          icon: '📋' },
]

export function categoryIcon(value) {
  return CATEGORIES.find(c => c.value === value)?.icon ?? '📋'
}

// Returns the cumulative income received from the start of the month up to and including `upToDay`.
// upToDay=0 means nothing has arrived yet.
export function cumulativeMonthlyIncome(incomes, upToDay) {
  return incomes.filter(i => i.active).reduce((sum, i) => {
    if (i.frequency === 'monthly') {
      const pd = i.payDay || 1
      return sum + (pd <= upToDay ? i.amount : 0)
    }
    if (i.frequency === 'weekly')      return sum + i.amount * (upToDay / 7)
    if (i.frequency === 'fortnightly') return sum + i.amount * (upToDay / 14)
    if (i.frequency === 'annual')      return sum + (i.amount / 12) * (upToDay / 31)
    return sum
  }, 0)
}

// Returns true if a bill is at risk of not having funds available the day before it's due.
// monthBills is the full { bill, dueDate }[] array for the month.
export function isBillAtRisk(dueDate, incomes, monthBills) {
  if (!dueDate || !incomes.some(i => i.active && i.payDay)) return false
  const dueDay = new Date(dueDate).getDate()
  const dayBefore = Math.max(0, dueDay - 1)
  const incomeAvailable = cumulativeMonthlyIncome(incomes, dayBefore)
  const billsDue = monthBills
    .filter(({ dueDate: d }) => d && new Date(d).getDate() <= dueDay)
    .reduce((s, { bill }) => s + bill.amount, 0)
  return incomeAvailable < billsDue
}

export const FREQUENCIES = [
  { value: 'monthly',     label: 'Monthly' },
  { value: 'weekly',      label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'quarterly',   label: 'Quarterly (3-monthly)' },
  { value: '6-monthly',   label: '6-monthly' },
  { value: 'annual',      label: 'Annual' },
  { value: 'custom',      label: 'Custom months' },
  { value: 'one-off',     label: 'One-off' },
]
