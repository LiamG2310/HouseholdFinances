const SYMBOLS = { GBP: '£', EUR: '€', USD: '$', AUD: 'A$' }

export function getSymbol(currency = 'GBP') {
  return SYMBOLS[currency] || '£'
}

export function formatCurrency(amount, currency = 'GBP') {
  const sym = getSymbol(currency)
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${amount < 0 ? '-' : ''}${sym}${formatted}`
}
