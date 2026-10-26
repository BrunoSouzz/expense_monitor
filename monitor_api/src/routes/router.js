import { send } from '../utils/http.js'
import * as systemController from '../controllers/system.controller.js'
import * as balanceController from '../controllers/balance.controller.js'
import * as summaryController from '../controllers/summary.controller.js'
import * as recurringController from '../controllers/recurring.controller.js'
import * as expenseController from '../controllers/expense.controller.js'
import * as incomeController from '../controllers/income.controller.js'

export const handleRequest = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204)

  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  // Welcome & API docs
  if (pathname === '/' && req.method === 'GET') {
    return systemController.getApiInfo(req, res)
  }

  // Health check
  if (pathname === '/health' && req.method === 'GET') {
    return systemController.getHealth(req, res)
  }

  // Summary
  if (pathname === '/api/v1/summary' && req.method === 'GET') {
    return summaryController.getSummary(req, res, url)
  }

  // Recurring trigger
  if (pathname === '/api/v1/recurring/process' && req.method === 'POST') {
    return recurringController.processRecurring(req, res)
  }

  // Initial balance
  if (pathname === '/api/v1/balance') {
    if (req.method === 'GET') return balanceController.getBalance(req, res, url)
    if (req.method === 'PUT') return balanceController.updateBalance(req, res)
    return send(res, 405, { detail: 'Método não permitido' })
  }

  // Backup & restore
  if (pathname === '/api/v1/backup') {
    if (req.method === 'GET') return systemController.getBackup(req, res)
    if (req.method === 'POST') return systemController.restoreBackup(req, res)
    return send(res, 405, { detail: 'Método não permitido' })
  }

  // Income
  const incomeMatch = pathname.match(/^\/api\/v1\/income(?:\/([^/]+))?$/)
  if (incomeMatch) {
    const incomeId = incomeMatch[1]
    if (req.method === 'GET') return incomeController.getIncomes(req, res, url)
    if (req.method === 'POST') return incomeController.createIncome(req, res)
    if (req.method === 'PUT' && incomeId) return incomeController.updateIncome(req, res, incomeId)
    if (req.method === 'DELETE' && incomeId) return incomeController.deleteIncome(req, res, incomeId)
    return send(res, 405, { detail: 'Método não permitido' })
  }

  // Quick toggle status for expense
  const toggleStatusMatch = pathname.match(/^\/api\/v1\/expenses\/([^/]+)\/toggle-status$/)
  if (toggleStatusMatch && (req.method === 'PATCH' || req.method === 'POST')) {
    return expenseController.toggleExpenseStatus(req, res, toggleStatusMatch[1])
  }

  // Expenses
  const expenseMatch = pathname.match(/^\/api\/v1\/expenses(?:\/([^/]+))?$/)
  if (expenseMatch) {
    const expenseId = expenseMatch[1]
    if (req.method === 'GET') return expenseController.getExpenses(req, res, url)
    if (req.method === 'POST') return expenseController.createExpense(req, res)
    if (req.method === 'PUT' && expenseId) return expenseController.updateExpense(req, res, expenseId)
    if (req.method === 'PATCH' && expenseId) return expenseController.patchExpense(req, res, expenseId)
    if (req.method === 'DELETE' && expenseId) return expenseController.deleteExpense(req, res, expenseId)
    return send(res, 405, { detail: 'Método não permitido' })
  }

  return send(res, 404, { detail: 'Rota não encontrada' })
}
