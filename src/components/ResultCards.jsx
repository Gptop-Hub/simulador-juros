import { formatCurrency } from '../utils/formatters'

export default function ResultCards({
  final,
  onCopyInterest,
  onCopyBalance,
  onCopySummary,
  onClear,
}) {
  if (!final) return null

  return (
    <div className="cards-wrap">
      <div className="cards">
        <div className="card">
          <div className="label">Valor total final</div>
          <div className="value">{formatCurrency(final.balance)}</div>
        </div>

        <div className="card">
          <div className="label">Valor total investido</div>
          <div className="value">{formatCurrency(final.capital)}</div>
        </div>

        <div className="card highlighted">
          <div className="label">Total em juros</div>
          <div className="value">{formatCurrency(final.totalInterest)}</div>
        </div>
      </div>

      <div className="result-actions">
        <button className="btn-primary" type="button" onClick={onCopyInterest}>Copiar juros</button>
        <button className="btn-primary" type="button" onClick={onCopyBalance}>Copiar valor final</button>
        <button className="btn-primary" type="button" onClick={onCopySummary}>Copiar resumo</button>
        <button className="btn-danger" type="button" onClick={onClear}>Limpar</button>
      </div>
    </div>
  )
}
