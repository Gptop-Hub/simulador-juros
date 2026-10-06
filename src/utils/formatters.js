export const DEFAULT_CURRENCY = 'BRL'

const currencyBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: DEFAULT_CURRENCY,
})

export function parseNumber(input) {
  if (input === null || input === undefined) return Number.NaN
  if (typeof input === 'number') return Number.isFinite(input) ? input : Number.NaN

  let raw = String(input).trim()
  if (!raw) return Number.NaN

  raw = raw.replace(/\s/g, '').replace(/[^\d,.-]/g, '')
  if (!raw || raw === '-' || raw === ',' || raw === '.') return Number.NaN

  const isNegative = raw.startsWith('-')
  raw = raw.replace(/-/g, '')

  const lastComma = raw.lastIndexOf(',')
  const lastDot = raw.lastIndexOf('.')
  const decimalIndex = Math.max(lastComma, lastDot)

  let integerPart = decimalIndex >= 0 ? raw.slice(0, decimalIndex) : raw
  let decimalPart = decimalIndex >= 0 ? raw.slice(decimalIndex + 1) : ''

  integerPart = integerPart.replace(/[.,]/g, '')
  decimalPart = decimalPart.replace(/[.,]/g, '')

  if (!integerPart && !decimalPart) return Number.NaN

  if (decimalIndex >= 0 && decimalPart.length === 3) {
    const remaining = raw.slice(decimalIndex + 1).replace(/[.,]/g, '')
    if (!raw.slice(0, decimalIndex).includes(',') && !raw.slice(0, decimalIndex).includes('.')) {
      integerPart = `${integerPart}${remaining}`
      decimalPart = ''
    }
  }

  let normalized = integerPart || '0'
  if (decimalPart) {
    normalized = `${normalized}.${decimalPart}`
  }

  if (isNegative) {
    normalized = `-${normalized}`
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function formatCurrency(value) {
  const parsed = parseNumber(value)
  const num = Number.isFinite(parsed) ? parsed : 0
  return currencyBRL.format(num)
}

export function formatNumber(value) {
  const parsed = parseNumber(value)
  const num = Number.isFinite(parsed) ? parsed : 0
  return num.toLocaleString('pt-BR')
}

function numberToWordsUnderThousand(value) {
  const units = ['zero', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

  const n = Math.max(0, Math.min(999, Number.parseInt(value, 10) || 0))

  if (n < 10) return units[n]
  if (n < 20) return teens[n - 10]
  if (n < 100) {
    const ten = Math.floor(n / 10)
    const unit = n % 10
    return unit ? `${tens[ten]} e ${units[unit]}` : tens[ten]
  }

  if (n === 100) return 'cem'

  const hundred = Math.floor(n / 100)
  const rest = n % 100

  if (!rest) return hundreds[hundred]
  return `${hundreds[hundred]} e ${numberToWordsUnderThousand(rest)}`
}

function numberToWordsPtBr(value) {
  const scales = [
    { singular: '', plural: '' },
    { singular: 'mil', plural: 'mil' },
    { singular: 'milhao', plural: 'milhoes' },
    { singular: 'bilhao', plural: 'bilhoes' },
    { singular: 'trilhao', plural: 'trilhoes' },
  ]

  const absolute = Math.abs(Number.parseInt(value, 10) || 0)
  if (!absolute) return 'zero'

  const triples = []
  let remaining = String(absolute)

  while (remaining.length > 0) {
    triples.unshift(remaining.slice(-3))
    remaining = remaining.slice(0, -3)
  }

  const parts = []
  const totalTriples = triples.length

  triples.forEach((triple, index) => {
    const chunk = Number.parseInt(triple, 10) || 0
    if (!chunk) return

    const scaleIndex = totalTriples - index - 1
    const chunkWords = numberToWordsUnderThousand(chunk)

    if (scaleIndex === 0) {
      parts.push(chunkWords)
      return
    }

    if (scaleIndex === 1) {
      if (chunk === 1) {
        parts.push('mil')
      } else {
        parts.push(`${chunkWords} mil`)
      }
      return
    }

    const scale = scales[scaleIndex] || scales[scales.length - 1]
    if (chunk === 1) {
      parts.push(`um ${scale.singular}`)
    } else {
      parts.push(`${chunkWords} ${scale.plural}`)
    }
  })

  return parts.join(' e ')
}

function formatScaleValue(value) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  })
}

export function formatMoneyHint(value, emptyLabel = 'Digite um valor.') {
  const parsed = parseNumber(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return emptyLabel

  const abs = Math.abs(parsed)
  const integerPart = Math.floor(abs)
  const decimalPart = Math.round((abs - integerPart) * 100)

  if (integerPart <= 999_999_999_999) {
    const integerWords = numberToWordsPtBr(integerPart)
    if (!decimalPart) return integerWords
    return `${integerWords} e ${decimalPart}/100`
  }

  if (abs < 1_000_000_000_000_000) {
    return `${formatScaleValue(parsed / 1_000_000_000_000)} trilhoes`
  }

  return formatCurrency(parsed)
}

export function sanitizeMoneyInput(value) {
  return String(value).replace(/[^\d.,]/g, '')
}

function formatIntegerWithGrouping(value) {
  const normalized = value.replace(/^0+(?=\d)/, '')
  if (!normalized) return '0'
  return Number.parseInt(normalized, 10).toLocaleString('pt-BR')
}

export function formatMoneyInput(value) {
  const raw = sanitizeMoneyInput(value)
  if (!raw) return ''
  const onlyDigits = raw.replace(/\D/g, '')
  if (!onlyDigits) return ''
  return formatIntegerWithGrouping(onlyDigits)
}

export function sanitizeRateInput(value) {
  return String(value).replace(/[^\d.,]/g, '')
}

export function sanitizeIntegerInput(value) {
  return String(value).replace(/[^\d]/g, '')
}
