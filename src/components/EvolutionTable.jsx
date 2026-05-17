import { formatCurrency } from '../utils/formatters'

export default function EvolutionTable({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="table-wrap">
      <table className="evolution-table">
        <thead>
          <tr>
            <th>Mês</th>
            <th>Saldo inicial</th>
            <th>Juros do mês</th>
            <th>Saldo final</th>
            <th>Juros acumulado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <td style={{ textAlign: 'left' }}>Mês {row.month}</td>
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
