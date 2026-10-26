import { randomUUID } from 'node:crypto'
import { send, readBody } from '../utils/http.js'
import { store, saveStore } from '../repositories/store.repository.js'
import { validateExpense } from '../validators/expense.validator.js'
import { ensureRecurringExpenses } from '../services/recurring.service.js'
import { getTodayIso, addMonthsSafe } from '../utils/date.js'

export const getExpenses = (req, res, url) => {
  const month = url.searchParams.get('month')
  ensureRecurringExpenses(month)
  let expenses = [...store.expenses]

  const status = url.searchParams.get('status')
  const category = url.searchParams.get('category')
  const query = url.searchParams.get('q')?.toLowerCase().trim()
  const today = getTodayIso()

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    expenses = expenses.filter((e) => e.date && e.date.startsWith(month))
  }
  if (status === 'overdue') {
    expenses = expenses.filter((e) => e.status === 'pending' && e.date && e.date < today)
  } else if (status && (status === 'paid' || status === 'pending')) {
    expenses = expenses.filter((e) => e.status === status)
  }
  if (category) {
    expenses = expenses.filter((e) => e.category.toLowerCase() === category.toLowerCase())
  }
  if (query) {
    expenses = expenses.filter((e) =>
      e.description.toLowerCase().includes(query) || (e.notes && e.notes.toLowerCase().includes(query))
    )
  }

  const sort = url.searchParams.get('sort') || 'date_desc'
  if (sort === 'date_asc') expenses.sort((a, b) => a.date.localeCompare(b.date))
  else if (sort === 'amount_desc') expenses.sort((a, b) => b.amount - a.amount)
  else if (sort === 'amount_asc') expenses.sort((a, b) => a.amount - b.amount)
  else expenses.sort((a, b) => b.date.localeCompare(a.date))

  return send(res, 200, expenses)
}

export const createExpense = async (req, res) => {
  const payload = validateExpense(await readBody(req))
  if (!payload) {
    return send(res, 400, { detail: 'Dados da despesa inválidos. Verifique descrição, valor, data e categoria.' })
  }

  // Automatic installments support
  const installmentsCount = payload.installments ? Math.min(Math.max(payload.installments, 1), 72) : 1

  if (installmentsCount > 1) {
    const groupId = randomUUID()
    const eachAmount = payload.installmentType === 'installment_value'
      ? payload.amount
      : Math.round((payload.amount / installmentsCount) * 100) / 100
    const createdList = []

    for (let i = 1; i <= installmentsCount; i++) {
      const installmentDate = addMonthsSafe(payload.date, i - 1)
      const isFirst = i === 1
      const item = {
        id: randomUUID(),
        description: `${payload.description} (${i}/${installmentsCount})`,
        amount: eachAmount,
        category: payload.category,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes || '',
        status: isFirst ? payload.status : 'pending',
        recurring: false,
        recurringFrequency: 'monthly',
        nextChargeDate: null,
        date: installmentDate,
        installmentGroupId: groupId,
        installmentIndex: i,
        installmentTotal: installmentsCount,
      }
      store.expenses.push(item)
      createdList.push(item)
    }

    saveStore()
    return send(res, 201, createdList[0])
  }

  // Standard or Recurring expense
  const expense = { id: randomUUID(), ...payload }
  store.expenses.push(expense)
  saveStore()

  // If recurring, automatically ensure upcoming month is scheduled
  if (expense.recurring) {
    ensureRecurringExpenses(expense.date.slice(0, 7))
  }

  return send(res, 201, expense)
}

export const updateExpense = async (req, res, id) => {
  const payload = validateExpense(await readBody(req))
  if (!payload) {
    return send(res, 400, { detail: 'Dados da despesa inválidos.' })
  }
  const index = store.expenses.findIndex((expense) => expense.id === id)
  if (index < 0) {
    return send(res, 404, { detail: 'Despesa não encontrada' })
  }
  store.expenses[index] = { id, ...payload }
  saveStore()

  if (payload.recurring) {
    ensureRecurringExpenses(payload.date.slice(0, 7))
  }

  return send(res, 200, store.expenses[index])
}

export const patchExpense = async (req, res, id) => {
  const index = store.expenses.findIndex((expense) => expense.id === id)
  if (index < 0) {
    return send(res, 404, { detail: 'Despesa não encontrada' })
  }
  const body = await readBody(req)
  if (body?.status && ['paid', 'pending'].includes(body.status)) {
    store.expenses[index].status = body.status
  }
  if (typeof body?.notes === 'string') {
    store.expenses[index].notes = body.notes.trim().slice(0, 240)
  }
  saveStore()
  return send(res, 200, store.expenses[index])
}

export const deleteExpense = (req, res, id) => {
  const index = store.expenses.findIndex((expense) => expense.id === id)
  if (index < 0) {
    return send(res, 404, { detail: 'Despesa não encontrada' })
  }
  store.expenses.splice(index, 1)
  saveStore()
  return send(res, 204)
}

export const toggleExpenseStatus = (req, res, id) => {
  const expense = store.expenses.find((item) => item.id === id)
  if (!expense) {
    return send(res, 404, { detail: 'Despesa não encontrada' })
  }
  expense.status = expense.status === 'paid' ? 'pending' : 'paid'
  saveStore()
  return send(res, 200, expense)
}
