import { useState } from 'react'
import { formatCurrency, parseNumber } from '../utils/formatters'

export default function CalculatorForm({ onCalculate }) {
  const [initial, setInitial] = useState(1000)
  const [monthly, setMonthly] = useState(100)
  const [rate, setRate] = useState(5)
  const [rateType, setRateType] = useState('annual')
  const [period, setPeriod] = useState(5)
  const [periodType, setPeriodType] = useState('years')

  function handleSubmit(e) {
    e.preventDefault()
    onCalculate({
      initial: parseNumber(initial) || 0,
      rate: parseNumber(rate) || 0,
      months: parseNumber(period) || 0,
    })
  }

  return (
    <form className="calc-form" onSubmit={handleSubmit}>
      <h2 className="card-title">Simulação</h2>
      <div className="row">
        <label>
          Valor inicial
          <input type="number" min="0" step="0.01" value={initial} onChange={(e) => setInitial(e.target.value)} />
          <small className="hint">{formatCurrency(initial)}</small>
        </label>
        <label>
          Aporte mensal
          <input type="number" min="0" step="0.01" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          <small className="hint">{formatCurrency(monthly)}</small>
        </label>
      </div>

      <div className="row">
        <label>
          Taxa
          <input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
          <small className="hint">{rateType === 'annual' ? 'Anual (%)' : 'Mensal (%)'}</small>
        </label>

        <label>
          Tipo da taxa
          <select value={rateType} onChange={(e) => setRateType(e.target.value)}>
            <option value="annual">Anual</option>
            <option value="monthly">Mensal</option>
          </select>
        </label>
      </div>

      <div className="row">
        <label>
          Período (meses)
          <input type="number" min="1" step="1" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </label>
      </div>

      <div className="actions">
        <button type="submit" className="btn-primary">Calcular</button>
      </div>
    </form>
  )
}
