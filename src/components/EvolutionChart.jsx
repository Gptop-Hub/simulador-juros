import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '../utils/formatters'

function CustomTooltip({ active, payload, label, periodType }) {
  if (!active || !payload || payload.length === 0) return null

  const periodLabel = periodType === 'years' ? 'Ano' : 'Mes'

  return (
    <div className="custom-tooltip">
      <div className="tt-label">{periodLabel} {label}</div>
      {payload.map((point) => (
        <div key={point.dataKey} className="tt-row">
          <span className="tt-name">{point.name}:</span>
          <span className="tt-value">{formatCurrency(point.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function EvolutionChart({ data, periodType = 'months' }) {
  if (!data || data.length === 0) return null

  const chartData = data.map((row) => ({
    period: row.month,
    endingBalance: row.endingBalance,
    accumulatedInterest: row.accumulatedInterest,
  }))

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip content={<CustomTooltip periodType={periodType} />} />
          <Legend />
          <Line name="Valor total final" type="monotone" dataKey="endingBalance" stroke="#60a5fa" dot={false} strokeWidth={2} />
          <Line name="Total em juros" type="monotone" dataKey="accumulatedInterest" stroke="#f59e0b" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
