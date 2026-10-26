import { isValidDate, addPeriod } from '../utils/date.js'

export const validateIncome = (body) => {
  const amount = Number(body?.amount)
  const recurring = Boolean(body?.recurring)
  const date = body?.date && isValidDate(body.date) ? body.date : new Date().toISOString().slice(0, 10)

  if (
    typeof body?.name !== 'string' || !body.name.trim()
    || !Number.isFinite(amount) || amount <= 0
    || (recurring && !['weekly', 'monthly', 'yearly'].includes(body.recurringFrequency))
  ) {
    return null
  }

  return {
    name: body.name.trim().slice(0, 60),
    amount: Math.round(amount * 100) / 100,
    recurring,
    recurringFrequency: body.recurringFrequency || 'monthly',
    nextCreditDate: recurring ? (body.nextCreditDate || addPeriod(date, body.recurringFrequency || 'monthly')) : null,
    date,
  }
}
