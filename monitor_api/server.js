import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const port = Number(process.env.PORT || 8000)
const dataDirectory = process.env.EXPENSE_MONITOR_DATA_DIR || path.join(process.cwd(), 'data')
const dataFile = path.join(dataDirectory, 'expense-monitor.json')
const configuredCorsOrigin = process.env.CORS_ORIGIN || '*'

mkdirSync(dataDirectory, { recursive: true })

const sanitizeExpense = (expense) => ({
  ...expense,
  status: expense.status === 'pending' ? 'pending' : 'paid',
})

const loadStore = () => {
  if (!existsSync(dataFile)) {
    return {
      initialBalance: 0,
      expenses: [],
      incomeSources: [],
    }
  }
  try {
    const raw = readFileSync(dataFile, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      initialBalance: typeof parsed.initialBalance === 'number' && Number.isFinite(parsed.initialBalance)
        ? Math.round(parsed.initialBalance * 100) / 100
        : 0,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses.map(sanitizeExpense) : [],
      incomeSources: Array.isArray(parsed.incomeSources) ? parsed.incomeSources : [],
    }
  } catch (error) {
    throw new Error(`Não foi possível ler o arquivo de dados: ${error.message}`)
  }
}

let store = loadStore()
const saveStore = () => {
  writeFileSync(dataFile, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
}

const resolveAllowedOrigin = (requestOrigin) => {
  if (configuredCorsOrigin === '*') return '*'
  if (!requestOrigin) return configuredCorsOrigin
  const allowedList = configuredCorsOrigin.split(',').map((item) => item.trim())
  if (allowedList.includes(requestOrigin) || allowedList.includes('*')) return requestOrigin
  return allowedList[0] || '*'
}

const send = (response, statusCode, body = null) => {
  const requestOrigin = response.req.headers.origin
  const allowedOrigin = resolveAllowedOrigin(requestOrigin)

  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
  })
  if (body !== null) response.end(JSON.stringify(body))
  else response.end()
}

const readBody = async (request) => {
  let raw = ''
  for await (const chunk of request) raw += chunk
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const isValidDate = (value) => {
  if (!value || typeof value !== 'string') return false
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
  const status = body?.status === 'pending' ? 'pending' : 'paid'
  const recurring = Boolean(body?.recurring)
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 240) : ''

  if (
    typeof body?.description !== 'string' || !body.description.trim()
    || typeof body?.category !== 'string' || !body.category.trim()
    || typeof body?.paymentMethod !== 'string' || !body.paymentMethod.trim()
    || (recurring && !['weekly', 'monthly', 'yearly'].includes(body.recurringFrequency))
    || !isValidDate(body?.date)
    || !Number.isFinite(amount) || amount <= 0
  ) return null

  return {
    description: body.description.trim().slice(0, 120),
    amount: Math.round(amount * 100) / 100,
    category: body.category.trim().slice(0, 40),
    paymentMethod: body.paymentMethod.trim().slice(0, 40),
    notes,
    status,
    recurring,
    recurringFrequency: body.recurringFrequency || 'weekly',
    nextChargeDate: recurring ? (body.nextChargeDate || addPeriod(body.date, body.recurringFrequency || 'weekly')) : null,
    date: body.date,
  }
}

const validateIncome = (body) => {
  const amount = Number(body?.amount)
  const recurring = Boolean(body?.recurring)
  const date = body?.date && isValidDate(body.date) ? body.date : new Date().toISOString().slice(0, 10)

  if (
    typeof body?.name !== 'string' || !body.name.trim()
    || !Number.isFinite(amount) || amount <= 0
    || (recurring && !['weekly', 'monthly', 'yearly'].includes(body.recurringFrequency))
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
      status: 'pending',
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
      date: today,
    })
    source.nextCreditDate = addPeriod(source.nextCreditDate, source.recurringFrequency)
    while (source.nextCreditDate <= today) source.nextCreditDate = addPeriod(source.nextCreditDate, source.recurringFrequency)
    incomeProcessed += 1
  }

  if (expensesProcessed || incomeProcessed) saveStore()
  return { expenses: expensesProcessed, income: incomeProcessed }
}

const calculateSummary = (monthFilter = null) => {
  let filteredExpenses = store.expenses
  let filteredIncome = store.incomeSources

  if (monthFilter && /^\d{4}-\d{2}$/.test(monthFilter)) {
    filteredExpenses = filteredExpenses.filter((expense) => expense.date && expense.date.startsWith(monthFilter))
    filteredIncome = filteredIncome.filter((income) => !income.date || income.date.startsWith(monthFilter))
  }

  const initialBalance = store.initialBalance || 0
  const totalIncome = filteredIncome.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const paidExpenses = filteredExpenses.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount), 0)
  const pendingExpenses = filteredExpenses.filter((item) => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount), 0)

  const currentBalance = Math.round((initialBalance + totalIncome - paidExpenses) * 100) / 100
  const projectedBalance = Math.round((initialBalance + totalIncome - totalExpenses) * 100) / 100

  const categoriesMap = {}
  for (const expense of filteredExpenses) {
    categoriesMap[expense.category] = (categoriesMap[expense.category] || 0) + Number(expense.amount)
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
    initialBalance: Math.round(initialBalance * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    paidExpenses: Math.round(paidExpenses * 100) / 100,
    pendingExpenses: Math.round(pendingExpenses * 100) / 100,
    currentBalance,
    projectedBalance,
    difference: Math.round((projectedBalance - (initialBalance + totalIncome)) * 100) / 100,
    expenseCount: filteredExpenses.length,
    incomeCount: filteredIncome.length,
    byCategory,
  }
}

export const createExpenseServer = () => {
  return createServer(async (request, response) => {
    if (request.method === 'OPTIONS') return send(response, 204)

    const url = new URL(request.url, `http://${request.headers.host}`)
    const pathname = url.pathname

    // Welcome & API docs
    if (request.method === 'GET' && pathname === '/') {
      return send(response, 200, {
        name: 'Expense Monitor API',
        version: '1.0.0',
        description: 'API leve para acompanhamento financeiro, simulação de saldo e controle de despesas sem necessidade de dinheiro real.',
        status: 'online',
        endpoints: {
          health: 'GET /health',
          summary: 'GET /api/v1/summary?month=YYYY-MM',
          balance: 'GET, PUT /api/v1/balance',
          expenses: 'GET, POST /api/v1/expenses, PUT, PATCH, DELETE /api/v1/expenses/:id',
          toggleExpenseStatus: 'PATCH /api/v1/expenses/:id/toggle-status',
          income: 'GET, POST /api/v1/income, PUT, DELETE /api/v1/income/:id',
          backup: 'GET, POST /api/v1/backup',
          recurring: 'POST /api/v1/recurring/process',
        },
      })
    }

    // Health check
    if (request.method === 'GET' && pathname === '/health') {
      return send(response, 200, {
        status: 'ok',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    }

    // Recurring process
    if (request.method === 'POST' && pathname === '/api/v1/recurring/process') {
      return send(response, 200, { processed: processRecurringTransactions() })
    }

    // Summary endpoint
    if (request.method === 'GET' && pathname === '/api/v1/summary') {
      processRecurringTransactions()
      const month = url.searchParams.get('month') || null
      return send(response, 200, calculateSummary(month))
    }

    // Initial balance endpoint
    if (pathname === '/api/v1/balance') {
      if (request.method === 'GET') {
        return send(response, 200, { initialBalance: store.initialBalance || 0 })
      }
      if (request.method === 'PUT') {
        const body = await readBody(request)
        const amount = Number(body?.initialBalance ?? body?.amount)
        if (!Number.isFinite(amount) || amount < 0) {
          return send(response, 400, { detail: 'Valor do saldo inicial inválido. Deve ser um número maior ou igual a zero.' })
        }
        store.initialBalance = Math.round(amount * 100) / 100
        saveStore()
        return send(response, 200, { initialBalance: store.initialBalance })
      }
      return send(response, 405, { detail: 'Método não permitido' })
    }

    // Backup & restore
    if (pathname === '/api/v1/backup') {
      if (request.method === 'GET') {
        return send(response, 200, {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          data: store,
        })
      }
      if (request.method === 'POST') {
        const body = await readBody(request)
        const incomingData = body?.data || body
        if (!incomingData || (!Array.isArray(incomingData.expenses) && !Array.isArray(incomingData.incomeSources))) {
          return send(response, 400, { detail: 'Estrutura de backup inválida.' })
        }
        store = {
          initialBalance: typeof incomingData.initialBalance === 'number' ? incomingData.initialBalance : 0,
          expenses: Array.isArray(incomingData.expenses) ? incomingData.expenses.map(sanitizeExpense) : [],
          incomeSources: Array.isArray(incomingData.incomeSources) ? incomingData.incomeSources : [],
        }
        saveStore()
        return send(response, 200, { message: 'Backup restaurado com sucesso.', summary: calculateSummary() })
      }
      return send(response, 405, { detail: 'Método não permitido' })
    }

    // Income endpoints
    const incomeMatch = pathname.match(/^\/api\/v1\/income(?:\/([^/]+))?$/)
    if (incomeMatch) {
      const incomeId = incomeMatch[1]
      if (request.method === 'GET') {
        processRecurringTransactions()
        const month = url.searchParams.get('month')
        let items = store.incomeSources
        if (month && /^\d{4}-\d{2}$/.test(month)) {
          items = items.filter((item) => !item.date || item.date.startsWith(month))
        }
        return send(response, 200, items)
      }
      if (request.method === 'POST') {
        const payload = validateIncome(await readBody(request))
        if (!payload) return send(response, 400, { detail: 'Dados da entrada inválidos. Forneça nome e valor positivo.' })
        const income = { id: randomUUID(), ...payload }
        store.incomeSources.push(income)
        saveStore()
        return send(response, 201, income)
      }
      if (request.method === 'PUT' && incomeId) {
        const payload = validateIncome(await readBody(request))
        if (!payload) return send(response, 400, { detail: 'Dados da entrada inválidos.' })
        const index = store.incomeSources.findIndex((item) => item.id === incomeId)
        if (index < 0) return send(response, 404, { detail: 'Entrada não encontrada' })
        store.incomeSources[index] = { id: incomeId, ...payload }
        saveStore()
        return send(response, 200, store.incomeSources[index])
      }
      if (request.method === 'DELETE' && incomeId) {
        const index = store.incomeSources.findIndex((income) => income.id === incomeId)
        if (index < 0) return send(response, 404, { detail: 'Entrada não encontrada' })
        store.incomeSources.splice(index, 1)
        saveStore()
        return send(response, 204)
      }
      return send(response, 405, { detail: 'Método não permitido' })
    }

    // Toggle expense status (quick patch)
    const toggleStatusMatch = pathname.match(/^\/api\/v1\/expenses\/([^/]+)\/toggle-status$/)
    if (toggleStatusMatch && (request.method === 'PATCH' || request.method === 'POST')) {
      const expenseId = toggleStatusMatch[1]
      const expense = store.expenses.find((item) => item.id === expenseId)
      if (!expense) return send(response, 404, { detail: 'Despesa não encontrada' })
      expense.status = expense.status === 'paid' ? 'pending' : 'paid'
      saveStore()
      return send(response, 200, expense)
    }

    // Expenses endpoints
    const expenseMatch = pathname.match(/^\/api\/v1\/expenses(?:\/([^/]+))?$/)
    if (expenseMatch) {
      const expenseId = expenseMatch[1]

      if (request.method === 'GET') {
        processRecurringTransactions()
        let expenses = [...store.expenses]

        // Query filters
        const month = url.searchParams.get('month')
        const status = url.searchParams.get('status')
        const category = url.searchParams.get('category')
        const query = url.searchParams.get('q')?.toLowerCase().trim()

        if (month && /^\d{4}-\d{2}$/.test(month)) {
          expenses = expenses.filter((e) => e.date && e.date.startsWith(month))
        }
        if (status && (status === 'paid' || status === 'pending')) {
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

        // Sort order
        const sort = url.searchParams.get('sort') || 'date_desc'
        if (sort === 'date_asc') expenses.sort((a, b) => a.date.localeCompare(b.date))
        else if (sort === 'amount_desc') expenses.sort((a, b) => b.amount - a.amount)
        else if (sort === 'amount_asc') expenses.sort((a, b) => a.amount - b.amount)
        else expenses.sort((a, b) => b.date.localeCompare(a.date))

        return send(response, 200, expenses)
      }

      if (request.method === 'POST') {
        const payload = validateExpense(await readBody(request))
        if (!payload) return send(response, 400, { detail: 'Dados da despesa inválidos. Verifique descrição, valor, data e categoria.' })
        const expense = { id: randomUUID(), ...payload }
        store.expenses.push(expense)
        saveStore()
        return send(response, 201, expense)
      }

      if (request.method === 'PUT' && expenseId) {
        const payload = validateExpense(await readBody(request))
        if (!payload) return send(response, 400, { detail: 'Dados da despesa inválidos.' })
        const index = store.expenses.findIndex((expense) => expense.id === expenseId)
        if (index < 0) return send(response, 404, { detail: 'Despesa não encontrada' })
        store.expenses[index] = { id: expenseId, ...payload }
        saveStore()
        return send(response, 200, store.expenses[index])
      }

      if (request.method === 'PATCH' && expenseId) {
        const index = store.expenses.findIndex((expense) => expense.id === expenseId)
        if (index < 0) return send(response, 404, { detail: 'Despesa não encontrada' })
        const body = await readBody(request)
        if (body?.status && ['paid', 'pending'].includes(body.status)) {
          store.expenses[index].status = body.status
        }
        if (typeof body?.notes === 'string') {
          store.expenses[index].notes = body.notes.trim().slice(0, 240)
        }
        saveStore()
        return send(response, 200, store.expenses[index])
      }

      if (request.method === 'DELETE' && expenseId) {
        const index = store.expenses.findIndex((expense) => expense.id === expenseId)
        if (index < 0) return send(response, 404, { detail: 'Despesa não encontrada' })
        store.expenses.splice(index, 1)
        saveStore()
        return send(response, 204)
      }

      return send(response, 405, { detail: 'Método não permitido' })
    }

    return send(response, 404, { detail: 'Rota não encontrada' })
  })
}

const server = createExpenseServer()

const isDirectRun = Boolean(
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()
)

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  server.listen(port, () => console.log(`Expense Monitor API rodando em http://localhost:${port}`))
  const recurringTimer = setInterval(processRecurringTransactions, 60 * 1000)
  recurringTimer.unref()
}
