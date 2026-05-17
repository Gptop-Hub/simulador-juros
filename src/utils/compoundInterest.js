import { parseNumber } from './formatters'

// simulateCompound for loan late fees: no monthly contributions.
// Returns timeline with month-by-month breakdown and final totals.
export function simulateCompound({
  initial = 0,
  rate = 0,
  months = 1,
}) {
  const capital = parseNumber(initial) || 0
  const monthlyRate = (parseNumber(rate) || 0) / 100
  const totalMonths = Math.max(0, Math.round(parseNumber(months) || 0))

  let balance = capital
  let totalInterest = 0
  const timeline = []

  for (let m = 1; m <= totalMonths; m++) {
    const startingBalance = balance
    const interest = startingBalance * monthlyRate
    const endingBalance = startingBalance + interest
    totalInterest = endingBalance - capital

    balance = endingBalance

    timeline.push({
      month: m,
      startingBalance: Number(startingBalance.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      endingBalance: Number(endingBalance.toFixed(2)),
      accumulatedInterest: Number(totalInterest.toFixed(2)),
    })
  }

  return {
    timeline,
    final: {
      balance: Number(balance.toFixed(2)),
      capital: Number(capital.toFixed(2)),
      totalInterest: Number((balance - capital).toFixed(2)),
    },
  }
}
