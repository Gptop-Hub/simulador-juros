import { formatCurrency } from '../utils/formatters'

export default function ResultCards({ final, onCopyInterest, onCopyBalance, onClear }) {
  if (!final) return null

  return (
    <div className="cards">
      <div className="card">
        <div className="label">Capital inicial</div>
        <div className="value">{formatCurrency(final.capital)}</div>
      </div>

      <div className="card highlighted">
        <div className="label">Juros acumulado</div>
        <div className="value">{formatCurrency(final.totalInterest)}</div>
        <div style={{ marginTop: 10 }}>
          <button className="btn-primary" onClick={() => onCopyInterest && onCopyInterest()} style={{ marginRight: 8 }}>Copiar juros</button>
        </div>
      </div>

      <div className="card">
        <div className="label">Valor final</div>
        <div className="value">{formatCurrency(final.balance)}</div>
        <div style={{ marginTop: 10 }}>
          <button className="btn-primary" onClick={() => onCopyBalance && onCopyBalance()} style={{ marginRight: 8 }}>Copiar valor final</button>
          <button className="btn-primary" onClick={() => onClear && onClear()} style={{ background: '#ef4444' }}>Limpar</button>
        </div>
      </div>
    </div>
  )
}
