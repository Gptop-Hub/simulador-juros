import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency } from '../utils/formatters'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="custom-tooltip">
      <div className="tt-label">Mês {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="tt-row">
          <span className="tt-name">{p.name}:</span>
          <span className="tt-value">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function EvolutionChart({ data }) {
  if (!data || data.length === 0) return null

  const chartData = data.map((d) => ({
    month: d.month,
    endingBalance: d.endingBalance,
    accumulatedInterest: d.accumulatedInterest,
  }))

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatCurrency(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line name="Saldo final" type="monotone" dataKey="endingBalance" stroke="#8b5cf6" dot={false} strokeWidth={2} />
          <Line name="Juros acumulado" type="monotone" dataKey="accumulatedInterest" stroke="#f59e0b" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
