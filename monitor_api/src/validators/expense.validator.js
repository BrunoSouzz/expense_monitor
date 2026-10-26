import { isValidDate, addPeriod } from '../utils/date.js'

export const sanitizeExpense = (expense) => ({
  ...expense,
  status: expense.status === 'pending' ? 'pending' : 'paid',
  category: typeof expense.category === 'string' ? expense.category.trim() : 'Outros',
  paymentMethod: typeof expense.paymentMethod === 'string' ? expense.paymentMethod.trim() : 'Pix',
})

export const validateExpense = (body) => {
  const amount = Number(body?.amount)
  const status = body?.status === 'pending' ? 'pending' : 'paid'
  const recurring = Boolean(body?.recurring)
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 240) : ''
  const category = typeof body?.category === 'string' ? body.category.trim().slice(0, 60) : ''
  const paymentMethod = typeof body?.paymentMethod === 'string' ? body.paymentMethod.trim().slice(0, 50) : ''

  if (
    typeof body?.description !== 'string' || !body.description.trim()
    || !category
    || !paymentMethod
    || (recurring && !['weekly', 'monthly', 'yearly'].includes(body.recurringFrequency))
    || !isValidDate(body?.date)
    || !Number.isFinite(amount) || amount <= 0
  ) {
    return null
  }

  return {
    description: body.description.trim().slice(0, 120),
    amount: Math.round(amount * 100) / 100,
    category,
    paymentMethod,
    notes,
    status,
    recurring,
    recurringFrequency: body.recurringFrequency || 'monthly',
    nextChargeDate: recurring ? (body.nextChargeDate || addPeriod(body.date, body.recurringFrequency || 'monthly')) : null,
    date: body.date,
    installments: body.installments ? Math.max(1, parseInt(body.installments, 10)) : null,
    installmentType: body.installmentType === 'installment_value' ? 'installment_value' : 'total',
    installmentGroupId: body.installmentGroupId || null,
    installmentIndex: Number.isInteger(body.installmentIndex) ? body.installmentIndex : null,
    installmentTotal: Number.isInteger(body.installmentTotal) ? body.installmentTotal : null,
    recurringSourceId: body.recurringSourceId || null,
  }
}
