export const DEFAULT_CURRENCY = 'GBP'

export const currencyGBP = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: DEFAULT_CURRENCY,
})

export function formatCurrency(value) {
  const num = parseNumber(value) || 0
  return currencyGBP.format(num)
}

export function formatNumber(value) {
  const num = parseNumber(value) || 0
  return num.toLocaleString('en-GB')
}

// Parse user input numbers robustly: accepts '1,000', '1.000,50', '£1,234.56', '1234.56'
export function parseNumber(input) {
  if (input === null || input === undefined) return 0
  if (typeof input === 'number' && !Number.isNaN(input)) return input
  let s = String(input).trim()
  if (s === '') return 0
  // remove currency symbols and spaces
  s = s.replace(/[^0-9.,-]/g, '')
  if (s === '') return 0

  const hasDot = s.indexOf('.') !== -1
  const hasComma = s.indexOf(',') !== -1

  if (hasDot && hasComma) {
    // assume comma is thousand separator: remove commas
    s = s.replace(/,/g, '')
    return Number(s)
  }

  if (hasComma && !hasDot) {
    // assume comma is decimal separator
    s = s.replace(/,/g, '.')
    return Number(s)
  }

  // otherwise plain number with dot or integer
  return Number(s)
}
