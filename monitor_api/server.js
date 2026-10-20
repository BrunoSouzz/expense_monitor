import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const port = Number(process.env.PORT || 8000)
const dataDirectory = process.env.EXPENSE_MONITOR_DATA_DIR || path.join(process.cwd(), 'data')
const dataFile = path.join(dataDirectory, 'expense-monitor.json')
mkdirSync(dataDirectory, { recursive: true })

const loadStore = () => {
  if (!existsSync(dataFile)) return { expenses: [], incomeSources: [] }
  try {
    const store = JSON.parse(readFileSync(dataFile, 'utf8'))
    return {
      expenses: Array.isArray(store.expenses) ? store.expenses : [],
      incomeSources: Array.isArray(store.incomeSources) ? store.incomeSources : [],
    }
  } catch (error) {
    throw new Error(`Não foi possível ler o arquivo de dados: ${error.message}`)
  }
}

let store = loadStore()
const saveStore = () => writeFileSync(dataFile, `${JSON.stringify(store, null, 2)}\n`, 'utf8')

const send = (response, statusCode, body = null) => {
  const requestOrigin = response.req.headers.origin
  const allowedOrigin = requestOrigin === 'http://localhost:5173' || requestOrigin === 'null'
    ? requestOrigin
    : 'http://localhost:5173'
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  })
  if (body !== null) response.end(JSON.stringify(body))
  else response.end()
}

const readBody = async (request) => {
  let raw = ''
  for await (const chunk of request) raw += chunk
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

const addPeriod = (dateValue, frequency) => {
  const date = new Date(`${dateValue}T00:00:00Z`)
  if (frequency === 'monthly') date.setUTCMonth(date.getUTCMonth() + 1)
  else if (frequency === 'yearly') date.setUTCFullYear(date.getUTCFullYear() + 1)
  else date.setUTCDate(date.getUTCDate() + 7)
  return date.toISOString().slice(0, 10)
}

const validateExpense = (body) => {
  const amount = Number(body?.amount)
  if (
    typeof body?.description !== 'string' || !body.description.trim()
    || typeof body?.category !== 'string' || !body.category.trim()
    || typeof body?.paymentMethod !== 'string' || !body.paymentMethod.trim()
    || typeof body?.notes !== 'string'
    || typeof body?.recurring !== 'boolean'
    || (body.recurring && !['weekly', 'monthly', 'yearly'].includes(body.recurringFrequency))
    || !isValidDate(body?.date)
    || !Number.isFinite(amount) || amount <= 0
  ) return null
  return {
    description: body.description.trim().slice(0, 120),
    amount: Math.round(amount * 100) / 100,
    category: body.category.trim().slice(0, 40),
    paymentMethod: body.paymentMethod.trim().slice(0, 40),
    notes: body.notes.trim().slice(0, 240),
    recurring: body.recurring,
    recurringFrequency: body.recurringFrequency || 'weekly',
    nextChargeDate: body.recurring ? (body.nextChargeDate || addPeriod(body.date, body.recurringFrequency || 'weekly')) : null,
    date: body.date,
  }
}

const validateIncome = (body) => {
  const amount = Number(body?.amount)
  const recurring = body?.recurring ?? false
  const date = body?.date || new Date().toISOString().slice(0, 10)
  if (
    typeof body?.name !== 'string' || !body.name.trim()
    || !Number.isFinite(amount) || amount <= 0
    || typeof recurring !== 'boolean'
    || (recurring && !['weekly', 'monthly', 'yearly'].includes(body.recurringFrequency))
    || !isValidDate(date)
  ) return null
  return {
    name: body.name.trim().slice(0, 60),
    amount: Math.round(amount * 100) / 100,
    recurring,
    recurringFrequency: body.recurringFrequency || 'monthly',
    nextCreditDate: recurring ? (body.nextCreditDate || addPeriod(date, body.recurringFrequency || 'monthly')) : null,
    date,
  }
}

const processRecurringTransactions = () => {
  const today = new Date().toISOString().slice(0, 10)
  let expensesProcessed = 0
  let incomeProcessed = 0

  for (const source of store.expenses.filter((expense) => expense.recurring && expense.nextChargeDate && expense.nextChargeDate <= today)) {
    store.expenses.push({
      id: randomUUID(),
      description: source.description,
      amount: source.amount,
      category: source.category,
      paymentMethod: source.paymentMethod,
      notes: `${source.notes ? `${source.notes} · ` : ''}Gerada automaticamente pela recorrência.`,
      recurring: false,
      recurringFrequency: source.recurringFrequency,
      nextChargeDate: null,
      date: today,
    })
    source.nextChargeDate = addPeriod(source.nextChargeDate, source.recurringFrequency)
    while (source.nextChargeDate <= today) source.nextChargeDate = addPeriod(source.nextChargeDate, source.recurringFrequency)
    expensesProcessed += 1
  }

  for (const source of store.incomeSources.filter((income) => income.recurring && income.nextCreditDate && income.nextCreditDate <= today)) {
    store.incomeSources.push({
      id: randomUUID(),
      name: source.name,
      amount: source.amount,
      recurring: false,
      recurringFrequency: source.recurringFrequency,
      nextCreditDate: null,
    })
    source.nextCreditDate = addPeriod(source.nextCreditDate, source.recurringFrequency)
    while (source.nextCreditDate <= today) source.nextCreditDate = addPeriod(source.nextCreditDate, source.recurringFrequency)
    incomeProcessed += 1
  }

  if (expensesProcessed || incomeProcessed) saveStore()
  return { expenses: expensesProcessed, income: incomeProcessed }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204)
  const url = new URL(request.url, `http://${request.headers.host}`)
  const expenseMatch = url.pathname.match(/^\/api\/v1\/expenses(?:\/([^/]+))?$/)
  const incomeMatch = url.pathname.match(/^\/api\/v1\/income(?:\/([^/]+))?$/)

  if (request.method === 'GET' && url.pathname === '/health') return send(response, 200, { status: 'ok' })
  if (request.method === 'POST' && url.pathname === '/api/v1/recurring/process') {
    return send(response, 200, { processed: processRecurringTransactions() })
  }
  if (!expenseMatch && !incomeMatch) return send(response, 404, { detail: 'Rota não encontrada' })

  if (incomeMatch) {
    if (request.method === 'GET') {
      processRecurringTransactions()
      return send(response, 200, store.incomeSources)
    }
    if (request.method === 'POST') {
      const payload = validateIncome(await readBody(request))
      if (!payload) return send(response, 400, { detail: 'Dados da entrada inválidos' })
      const income = { id: randomUUID(), ...payload }
      store.incomeSources.push(income)
      saveStore()
      return send(response, 201, income)
    }
    if (request.method === 'DELETE') {
      const index = store.incomeSources.findIndex((income) => income.id === incomeMatch[1])
      if (index < 0) return send(response, 404, { detail: 'Entrada não encontrada' })
      store.incomeSources.splice(index, 1)
      saveStore()
      return send(response, 204)
    }
    return send(response, 405, { detail: 'Método não permitido' })
  }

  if (request.method === 'GET') {
    processRecurringTransactions()
    const expenses = [...store.expenses].sort((first, second) => second.date.localeCompare(first.date))
    return send(response, 200, expenses)
  }

  if (request.method === 'POST' || request.method === 'PUT') {
    const payload = validateExpense(await readBody(request))
    if (!payload) return send(response, 400, { detail: 'Dados da despesa inválidos' })
    if (request.method === 'POST') {
      const expense = { id: randomUUID(), ...payload }
      store.expenses.push(expense)
      saveStore()
      return send(response, 201, expense)
    }
    const index = store.expenses.findIndex((expense) => expense.id === expenseMatch[1])
    if (index < 0) return send(response, 404, { detail: 'Despesa não encontrada' })
    store.expenses[index] = { id: expenseMatch[1], ...payload }
    saveStore()
    return send(response, 200, store.expenses[index])
  }

  if (request.method === 'DELETE') {
    const index = store.expenses.findIndex((expense) => expense.id === expenseMatch[1])
    if (index < 0) return send(response, 404, { detail: 'Despesa não encontrada' })
    store.expenses.splice(index, 1)
    saveStore()
    return send(response, 204)
  }
  return send(response, 405, { detail: 'Método não permitido' })
})

server.listen(port, () => console.log(`Expense Monitor API rodando em http://localhost:${port}`))
const recurringTimer = setInterval(processRecurringTransactions, 60 * 1000)
recurringTimer.unref()
