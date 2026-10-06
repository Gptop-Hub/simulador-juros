import { formatCurrency } from '../utils/formatters'

export default function EvolutionTable({ data, periodType = 'months' }) {
  if (!data || data.length === 0) return null

  const periodLabel = periodType === 'years' ? 'Ano' : 'Mes'

  return (
    <div className="table-wrap">
      <table className="evolution-table">
        <thead>
          <tr>
            <th>{periodLabel}</th>
            <th>Saldo inicial</th>
            <th>Juros do periodo</th>
            <th>Valor total final</th>
            <th>Total em juros</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <td style={{ textAlign: 'left' }}>{periodLabel} {row.month}</td>
              <td>{formatCurrency(row.startingBalance)}</td>
              <td>{formatCurrency(row.interest)}</td>
              <td>{formatCurrency(row.endingBalance)}</td>
              <td>{formatCurrency(row.accumulatedInterest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
