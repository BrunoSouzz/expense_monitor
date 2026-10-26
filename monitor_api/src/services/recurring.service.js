import { randomUUID } from 'node:crypto'
import { store, saveStore } from '../repositories/store.repository.js'
import { addPeriod, addMonthsSafe, getTodayIso } from '../utils/date.js'

export const ensureRecurringExpenses = (targetMonth = null) => {
  const today = getTodayIso()
  const currentMonth = today.slice(0, 7)
  const nextMonth = addMonthsSafe(`${currentMonth}-01`, 1).slice(0, 7)

  const monthsToEnsure = new Set([currentMonth, nextMonth])
  if (targetMonth && /^\d{4}-\d{2}$/.test(targetMonth)) {
    monthsToEnsure.add(targetMonth)
    monthsToEnsure.add(addMonthsSafe(`${targetMonth}-01`, 1).slice(0, 7))
  }

  let generatedExpenses = 0

  // 1. Process recurring expenses
  const recurringSources = store.expenses.filter((e) => e.recurring)
  for (const source of recurringSources) {
    const sourceId = source.recurringSourceId || source.id
    source.recurringSourceId = sourceId

    const [srcY, srcM, srcD] = (source.date || today).split('-').map(Number)
    const sourceMonth = `${srcY}-${String(srcM).padStart(2, '0')}`

    for (const m of monthsToEnsure) {
      if (m <= sourceMonth) continue

      const alreadyExists = store.expenses.some(
        (e) => (e.id === sourceId || e.recurringSourceId === sourceId) && e.date && e.date.startsWith(m)
      )

      if (!alreadyExists) {
        // Calculate safe day in target month
        const [targetY, targetMonthNum] = m.split('-').map(Number)
        const daysInTargetMonth = new Date(Date.UTC(targetY, targetMonthNum, 0)).getUTCDate()
        const safeDay = Math.min(srcD, daysInTargetMonth)
        const newDate = `${m}-${String(safeDay).padStart(2, '0')}`

        store.expenses.push({
          id: randomUUID(),
          description: source.description,
          amount: source.amount,
          category: source.category,
          paymentMethod: source.paymentMethod,
          notes: source.notes ? `${source.notes} · Recorrência fixa` : 'Recorrência fixa mensal',
          status: 'pending',
          recurring: true,
          recurringFrequency: source.recurringFrequency || 'monthly',
          recurringSourceId: sourceId,
          date: newDate,
        })
        generatedExpenses += 1
      }
    }
  }

  // 2. Process recurring income
  let generatedIncome = 0
  const recurringIncomeSources = store.incomeSources.filter((i) => i.recurring)
  for (const source of recurringIncomeSources) {
    const sourceId = source.recurringSourceId || source.id
    source.recurringSourceId = sourceId

    const srcDate = source.date || `${currentMonth}-01`
    const [srcY, srcM, srcD] = srcDate.split('-').map(Number)
    const sourceMonth = `${srcY}-${String(srcM).padStart(2, '0')}`

    for (const m of monthsToEnsure) {
      if (m <= sourceMonth) continue

      const alreadyExists = store.incomeSources.some(
        (i) => (i.id === sourceId || i.recurringSourceId === sourceId) && i.date && i.date.startsWith(m)
      )

      if (!alreadyExists) {
        const [targetY, targetMonthNum] = m.split('-').map(Number)
        const daysInTargetMonth = new Date(Date.UTC(targetY, targetMonthNum, 0)).getUTCDate()
        const safeDay = Math.min(srcD, daysInTargetMonth)
        const newDate = `${m}-${String(safeDay).padStart(2, '0')}`

        store.incomeSources.push({
          id: randomUUID(),
          name: source.name,
          amount: source.amount,
          recurring: true,
          recurringFrequency: source.recurringFrequency || 'monthly',
          recurringSourceId: sourceId,
          date: newDate,
        })
        generatedIncome += 1
      }
    }
  }

  if (generatedExpenses > 0 || generatedIncome > 0) {
    saveStore()
  }

  return { expenses: generatedExpenses, income: generatedIncome }
}

export const processRecurringTransactions = (targetMonth = null) => {
  return ensureRecurringExpenses(targetMonth)
}

