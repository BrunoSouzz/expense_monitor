import { store } from '../repositories/store.repository.js'
import { getTodayIso } from '../utils/date.js'
import { ensureRecurringExpenses } from './recurring.service.js'

export const getMonthStartingBalance = (monthFilter) => {
  const baseBalance = store.initialBalance || 0
  if (!monthFilter || !/^\d{4}-\d{2}$/.test(monthFilter)) {
    return baseBalance
  }

  // Rollover from prior months: all income before this month minus all expenses before this month
  const priorCutoff = `${monthFilter}-01`
  const priorIncome = store.incomeSources
    .filter((item) => item.date && item.date < priorCutoff)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const priorExpenses = store.expenses
    .filter((item) => item.date && item.date < priorCutoff)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return Math.round((baseBalance + priorIncome - priorExpenses) * 100) / 100
}

export const calculateSummary = (monthFilter = null) => {
  ensureRecurringExpenses(monthFilter)
  const today = getTodayIso()

  let filteredExpenses = store.expenses
  let filteredIncome = store.incomeSources

  if (monthFilter && /^\d{4}-\d{2}$/.test(monthFilter)) {
    filteredExpenses = filteredExpenses.filter((expense) => expense.date && expense.date.startsWith(monthFilter))
    filteredIncome = filteredIncome.filter((income) => !income.date || income.date.startsWith(monthFilter))
  }

  const initialBalance = getMonthStartingBalance(monthFilter)
  const totalIncome = filteredIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const paidExpenses = filteredExpenses.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const pendingExpenses = filteredExpenses.filter((item) => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount || 0), 0)

  // Overdue expenses
  const overdueExpensesList = filteredExpenses.filter((item) => item.status === 'pending' && item.date && item.date < today)
  const overdueCount = overdueExpensesList.length
  const overdueTotal = overdueExpensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const currentBalance = Math.round((initialBalance + totalIncome - paidExpenses) * 100) / 100
  const projectedBalance = Math.round((initialBalance + totalIncome - totalExpenses) * 100) / 100

  const categoriesMap = {}
  for (const expense of filteredExpenses) {
    categoriesMap[expense.category] = (categoriesMap[expense.category] || 0) + Number(expense.amount || 0)
  }

  const byCategory = Object.entries(categoriesMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    month: monthFilter,
    baseInitialBalance: store.initialBalance || 0,
    initialBalance: Math.round(initialBalance * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    availableFunds: Math.round((initialBalance + totalIncome) * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    paidExpenses: Math.round(paidExpenses * 100) / 100,
    pendingExpenses: Math.round(pendingExpenses * 100) / 100,
    overdueCount,
    overdueTotal: Math.round(overdueTotal * 100) / 100,
    currentBalance,
    projectedBalance,
    difference: Math.round((projectedBalance - (initialBalance + totalIncome)) * 100) / 100,
    expenseCount: filteredExpenses.length,
    incomeCount: filteredIncome.length,
    byCategory,
  }
}
