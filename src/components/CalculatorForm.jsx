import { useEffect, useMemo, useState } from 'react'
import {
  formatMoneyInput,
  formatMoneyHint,
  parseNumber,
  sanitizeIntegerInput,
  sanitizeRateInput,
} from '../utils/formatters'

const PERIOD_OPTIONS = {
  months: 'mes(es)',
  years: 'ano(s)',
}

const RATE_OPTIONS = {
  monthly: 'ao mes',
  annual: 'ao ano',
}

function convertRateToPeriod(ratePercent, rateType, periodType) {
  if (rateType === 'monthly' && periodType === 'months') return ratePercent
  if (rateType === 'annual' && periodType === 'years') return ratePercent

  const rateDecimal = ratePercent / 100

  if (rateType === 'annual' && periodType === 'months') {
    return ((1 + rateDecimal) ** (1 / 12) - 1) * 100
  }

  if (rateType === 'monthly' && periodType === 'years') {
    return ((1 + rateDecimal) ** 12 - 1) * 100
  }

  return ratePercent
}

function parsePeriod(value) {
  const onlyDigits = sanitizeIntegerInput(value)
  if (!onlyDigits) return Number.NaN

  const parsed = Number.parseInt(onlyDigits, 10)
  return Number.isInteger(parsed) ? parsed : Number.NaN
}

export default function CalculatorForm({ onCalculate, clearSignal }) {
  const [initial, setInitial] = useState('')
  const [monthly, setMonthly] = useState('0')
  const [rate, setRate] = useState('10')
  const [rateType, setRateType] = useState('monthly')
  const [period, setPeriod] = useState('5')
  const [periodType, setPeriodType] = useState('years')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setInitial('')
    setMonthly('0')
    setRate('10')
    setRateType('monthly')
    setPeriod('5')
    setPeriodType('years')
    setFormError('')
  }, [clearSignal])

  const initialHint = useMemo(() => {
    return formatMoneyHint(initial, 'Digite o valor inicial para calcular.')
  }, [initial])

  const monthlyHint = useMemo(() => {
    const parsed = parseNumber(monthly)
    if (!Number.isFinite(parsed) || parsed <= 0) return 'Sem valor mensal.'
    return formatMoneyHint(monthly, 'Sem valor mensal.')
  }, [monthly])

  const normalizedRate = useMemo(() => {
    const parsed = parseNumber(rate)
    return Number.isFinite(parsed) ? parsed : 0
  }, [rate])

  const equivalentRate = useMemo(() => {
    return convertRateToPeriod(normalizedRate, rateType, periodType)
  }, [normalizedRate, rateType, periodType])

  function handleSubmit(e) {
    e.preventDefault()

    const initialValue = parseNumber(initial)
    if (!Number.isFinite(initialValue) || initialValue <= 0) {
      setFormError('Digite um valor inicial valido.')
      return
    }

    const monthlyValue = parseNumber(monthly)
    const safeMonthly = Number.isFinite(monthlyValue) && monthlyValue >= 0 ? monthlyValue : 0

    const rateValue = parseNumber(rate)
    if (!Number.isFinite(rateValue) || rateValue < 0) {
      setFormError('Digite uma taxa de juros valida.')
      return
    }

    const periodValue = parsePeriod(period)
    if (!Number.isInteger(periodValue) || periodValue < 1) {
      setFormError('Periodo deve ser um numero inteiro maior ou igual a 1.')
      return
    }

    setFormError('')

    const effectiveRate = convertRateToPeriod(rateValue, rateType, periodType)

    onCalculate({
      simulationInput: {
        initial: initialValue,
        rate: effectiveRate,
        months: periodValue,
      },
      userInput: {
        initial: initialValue,
        monthly: safeMonthly,
        rate: rateValue,
        rateType,
        period: periodValue,
        periodType,
      },
    })
  }

  function handleDecrementPeriod() {
    const current = parsePeriod(period)
    if (!Number.isInteger(current) || current <= 1) {
      setPeriod('1')
      return
    }

    setPeriod(String(current - 1))
  }

  function handleIncrementPeriod() {
    const current = parsePeriod(period)
    const safeCurrent = Number.isInteger(current) && current >= 1 ? current : 1
    setPeriod(String(safeCurrent + 1))
  }

  return (
    <form className="calc-form" onSubmit={handleSubmit}>
      <h2 className="card-title">Simulacao</h2>

      <div className="row">
        <label>
          Valor inicial
          <input
            type="text"
            inputMode="decimal"
            value={initial}
            placeholder="R$ 00,00"
            onChange={(e) => {
              setInitial(formatMoneyInput(e.target.value))
              if (formError) setFormError('')
            }}
          />
          <small className="hint">{initialHint}</small>
        </label>

        <label>
          Valor mensal
          <input
            type="text"
            inputMode="decimal"
            value={monthly}
            placeholder="R$ 00,00"
            onChange={(e) => setMonthly(formatMoneyInput(e.target.value))}
          />
          <small className="hint">{monthlyHint}</small>
        </label>
      </div>

      <div className="row">
        <label>
          Taxa de juros
          <input
            type="text"
            inputMode="decimal"
            value={rate}
            placeholder="0,00"
            onChange={(e) => {
              setRate(sanitizeRateInput(e.target.value))
              if (formError) setFormError('')
            }}
          />
          <small className="hint">
            {RATE_OPTIONS[rateType]} | Equivalente em {PERIOD_OPTIONS[periodType]}:{' '}
            {equivalentRate.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%
          </small>
        </label>

        <label>
          Tipo da taxa
          <select value={rateType} onChange={(e) => setRateType(e.target.value)}>
            <option value="monthly">Mensal</option>
            <option value="annual">Anual</option>
          </select>
        </label>
      </div>

      <div className="row">
        <label className="period-label">
          Periodo
          <div className="period-control-wrap">
            <div className="period-control">
              <button type="button" className="btn-step" onClick={handleDecrementPeriod} aria-label="Diminuir periodo">
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={period}
                onChange={(e) => setPeriod(sanitizeIntegerInput(e.target.value))}
                onBlur={() => {
                  const parsed = parsePeriod(period)
                  if (!Number.isInteger(parsed) || parsed < 1) {
                    setPeriod('1')
                  }
                }}
              />
              <button type="button" className="btn-step" onClick={handleIncrementPeriod} aria-label="Aumentar periodo">
                +
              </button>
            </div>
            <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="period-unit-select">
              <option value="months">mes(es)</option>
              <option value="years">ano(s)</option>
            </select>
          </div>
        </label>
      </div>

      {formError && <p className="form-error">{formError}</p>}

      <div className="actions">
        <button type="submit" className="btn-primary">Calcular</button>
      </div>
    </form>
  )
}
