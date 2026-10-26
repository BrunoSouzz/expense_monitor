import { randomUUID } from 'node:crypto'
import { send, readBody } from '../utils/http.js'
import { store, saveStore } from '../repositories/store.repository.js'
import { validateIncome } from '../validators/income.validator.js'
import { processRecurringTransactions } from '../services/recurring.service.js'

export const getIncomes = (req, res, url) => {
  processRecurringTransactions()
  const month = url.searchParams.get('month')
  let items = store.incomeSources
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    items = items.filter((item) => !item.date || item.date.startsWith(month))
  }
  return send(res, 200, items)
}

export const createIncome = async (req, res) => {
  const payload = validateIncome(await readBody(req))
  if (!payload) {
    return send(res, 400, { detail: 'Dados da entrada inválidos. Forneça nome e valor positivo.' })
  }
  const income = { id: randomUUID(), ...payload }
  store.incomeSources.push(income)
  saveStore()
  return send(res, 201, income)
}

export const updateIncome = async (req, res, id) => {
  const payload = validateIncome(await readBody(req))
  if (!payload) {
    return send(res, 400, { detail: 'Dados da entrada inválidos.' })
  }
  const index = store.incomeSources.findIndex((item) => item.id === id)
  if (index < 0) {
    return send(res, 404, { detail: 'Entrada não encontrada' })
  }
  store.incomeSources[index] = { id, ...payload }
  saveStore()
  return send(res, 200, store.incomeSources[index])
}

export const deleteIncome = (req, res, id) => {
  const index = store.incomeSources.findIndex((income) => income.id === id)
  if (index < 0) {
    return send(res, 404, { detail: 'Entrada não encontrada' })
  }
  store.incomeSources.splice(index, 1)
  saveStore()
  return send(res, 204)
}
