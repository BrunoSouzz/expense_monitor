import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const port = Number(process.env.PORT || 8000)
const dataDirectory = process.env.EXPENSE_MONITOR_DATA_DIR || path.join(process.cwd(), 'data')
mkdirSync(dataDirectory, { recursive: true })
const database = new Database(path.join(dataDirectory, 'expense-monitor.db'))

database.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    recurring INTEGER NOT NULL DEFAULT 0,
    recurring_frequency TEXT NOT NULL DEFAULT 'weekly',
    next_charge_date TEXT,
    date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS income_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    recurring INTEGER NOT NULL DEFAULT 0,
    recurring_frequency TEXT NOT NULL DEFAULT 'monthly',
    next_credit_date TEXT
  );
`)
const expenseColumnsInDatabase = database.prepare('PRAGMA table_info(expenses)').all().map((column) => column.name)
if (!expenseColumnsInDatabase.includes('recurring_frequency')) database.exec("ALTER TABLE expenses ADD COLUMN recurring_frequency TEXT NOT NULL DEFAULT 'weekly'")
if (!expenseColumnsInDatabase.includes('next_charge_date')) database.exec('ALTER TABLE expenses ADD COLUMN next_charge_date TEXT')
const incomeColumnsInDatabase = database.prepare('PRAGMA table_info(income_sources)').all().map((column) => column.name)
if (!incomeColumnsInDatabase.includes('recurring')) database.exec('ALTER TABLE income_sources ADD COLUMN recurring INTEGER NOT NULL DEFAULT 0')
if (!incomeColumnsInDatabase.includes('recurring_frequency')) database.exec("ALTER TABLE income_sources ADD COLUMN recurring_frequency TEXT NOT NULL DEFAULT 'monthly'")
if (!incomeColumnsInDatabase.includes('next_credit_date')) database.exec('ALTER TABLE income_sources ADD COLUMN next_credit_date TEXT')

const expenseFromRow = (row) => ({
  id: row.id,
  description: row.description,
  amount: row.amount,
  category: row.category,
  paymentMethod: row.payment_method,
  notes: row.notes,
  recurring: Boolean(row.recurring),
  recurringFrequency: row.recurring_frequency,
  nextChargeDate: row.next_charge_date,
  date: row.date,
})

const incomeFromRow = (row) => ({
  id: row.id,
  name: row.name,
  amount: row.amount,
  recurring: Boolean(row.recurring),
  recurringFrequency: row.recurring_frequency,
  nextCreditDate: row.next_credit_date,
})
const expenseColumns = 'id, description, amount, category, payment_method, notes, recurring, recurring_frequency, next_charge_date, date'
const incomeColumns = 'id, name, amount, recurring, recurring_frequency, next_credit_date'

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

const chargeRecurringExpenses = () => {
  const today = new Date().toISOString().slice(0, 10)
  const recurring = database.prepare(`
    SELECT ${expenseColumns} FROM expenses
    WHERE recurring = 1 AND next_charge_date IS NOT NULL AND next_charge_date <= ?
  `).all(today)
  const insert = database.prepare(`
    INSERT INTO expenses (id, description, amount, category, payment_method, notes, recurring, recurring_frequency, next_charge_date, date)
    VALUES (@id, @description, @amount, @category, @paymentMethod, @notes, 0, @recurringFrequency, NULL, @date)
  `)
  const update = database.prepare('UPDATE expenses SET next_charge_date = ? WHERE id = ?')
  const charge = database.transaction(() => {
    for (const source of recurring) {
      insert.run({
        id: randomUUID(),
        description: source.description,
        amount: source.amount,
        category: source.category,
        paymentMethod: source.payment_method,
        notes: `${source.notes ? `${source.notes} · ` : ''}Gerada automaticamente pela recorrência.`,
        recurringFrequency: source.recurring_frequency,
        date: today,
      })
      let nextChargeDate = addPeriod(source.next_charge_date, source.recurring_frequency)
      while (nextChargeDate <= today) {
        nextChargeDate = addPeriod(nextChargeDate, source.recurring_frequency)
      }

      update.run(nextChargeDate, source.id)
    }
    return recurring.length
  })
  return charge()
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204)
  const url = new URL(request.url, `http://${request.headers.host}`)
  const expenseMatch = url.pathname.match(/^\/api\/v1\/expenses(?:\/([^/]+))?$/)
  const incomeMatch = url.pathname.match(/^\/api\/v1\/income(?:\/([^/]+))?$/)

  if (request.method === 'GET' && url.pathname === '/health') return send(response, 200, { status: 'ok' })
  if (request.method === 'POST' && url.pathname === '/api/v1/recurring/process') {
    const processed = chargeRecurringExpenses()
    return send(response, 200, { processed: { expenses: processed } })
  }
  if (!expenseMatch && !incomeMatch) return send(response, 404, { detail: 'Rota não encontrada' })

  if (incomeMatch) {
    if (request.method === 'GET') {
      const rows = database.prepare(`SELECT ${incomeColumns} FROM income_sources ORDER BY rowid`).all()
      return send(response, 200, rows.map(incomeFromRow))
    }
    if (request.method === 'POST') {
      const body = await readBody(request)
      const payload = validateIncome(body)
      if (!payload) return send(response, 400, { detail: 'Dados da entrada inválidos' })
      const income = { id: randomUUID(), ...payload }
      database.prepare(`
        INSERT INTO income_sources (id, name, amount, recurring, recurring_frequency, next_credit_date)
        VALUES (@id, @name, @amount, @recurring, @recurringFrequency, @nextCreditDate)
      `).run({ ...income, recurring: Number(income.recurring) })
      return send(response, 201, income)
    }
    if (request.method === 'DELETE') {
      const result = database.prepare('DELETE FROM income_sources WHERE id = ?').run(incomeMatch[1])
      if (!result.changes) return send(response, 404, { detail: 'Entrada não encontrada' })
      return send(response, 204)
    }
    return send(response, 405, { detail: 'Método não permitido' })
  }

  if (request.method === 'GET') {
    const rows = database.prepare(`SELECT ${expenseColumns} FROM expenses ORDER BY date DESC, rowid DESC`).all()
    return send(response, 200, rows.map(expenseFromRow))
  }

  if (request.method === 'POST' || request.method === 'PUT') {
    const payload = validateExpense(await readBody(request))
    if (!payload) return send(response, 400, { detail: 'Dados da despesa inválidos' })
    if (request.method === 'POST') {
      const expense = { id: randomUUID(), ...payload }
      database.prepare(`
        INSERT INTO expenses (id, description, amount, category, payment_method, notes, recurring, date)
        VALUES (@id, @description, @amount, @category, @paymentMethod, @notes, @recurring, @date)
      `).run({ ...expense, recurring: Number(expense.recurring) })
      database.prepare(`
        UPDATE expenses SET recurring_frequency = @recurringFrequency, next_charge_date = @nextChargeDate WHERE id = @id
      `).run({ id: expense.id, recurringFrequency: expense.recurringFrequency, nextChargeDate: expense.nextChargeDate })
      return send(response, 201, expense)
    }
    const existing = database.prepare('SELECT id FROM expenses WHERE id = ?').get(expenseMatch[1])
    if (!existing) return send(response, 404, { detail: 'Despesa não encontrada' })
    database.prepare(`
      UPDATE expenses
      SET description = @description, amount = @amount, category = @category,
          payment_method = @paymentMethod, notes = @notes, recurring = @recurring,
          recurring_frequency = @recurringFrequency, next_charge_date = @nextChargeDate, date = @date
      WHERE id = @id
    `).run({ id: expenseMatch[1], ...payload, recurring: Number(payload.recurring) })
    return send(response, 200, { id: expenseMatch[1], ...payload })
  }

  if (request.method === 'DELETE') {
    const result = database.prepare('DELETE FROM expenses WHERE id = ?').run(expenseMatch[1])
    if (!result.changes) return send(response, 404, { detail: 'Despesa não encontrada' })
    return send(response, 204)
  }
  return send(response, 405, { detail: 'Método não permitido' })
})

server.listen(port, () => console.log(`Expense Monitor API rodando em http://localhost:${port}`))
