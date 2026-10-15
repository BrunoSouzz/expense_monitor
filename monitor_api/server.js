import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const port = Number(process.env.PORT || 8000)
const expenses = [
  { id: randomUUID(), description: 'Mercado da semana', amount: 186.90, category: 'Alimentação', paymentMethod: 'Cartão de débito', notes: '', recurring: false, date: new Date().toISOString().slice(0, 10) },
  { id: randomUUID(), description: 'Assinatura de streaming', amount: 39.90, category: 'Lazer', paymentMethod: 'Cartão de crédito', notes: 'Plano mensal', recurring: true, date: new Date().toISOString().slice(0, 10) },
]

const send = (response, statusCode, body = null) => {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
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

const validateExpense = (body) => {
  const amount = Number(body?.amount)
  if (
    typeof body?.description !== 'string' || !body.description.trim()
    || typeof body?.category !== 'string' || !body.category.trim()
    || typeof body?.paymentMethod !== 'string' || !body.paymentMethod.trim()
    || typeof body?.notes !== 'string'
    || typeof body?.recurring !== 'boolean'
    || !/^\d{4}-\d{2}-\d{2}$/.test(body?.date)
    || !Number.isFinite(amount) || amount <= 0
  ) return null
  return {
    description: body.description.trim().slice(0, 120),
    amount: Math.round(amount * 100) / 100,
    category: body.category.trim().slice(0, 40),
    paymentMethod: body.paymentMethod.trim().slice(0, 40),
    notes: body.notes.trim().slice(0, 240),
    recurring: body.recurring,
    date: body.date,
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204)
  const url = new URL(request.url, `http://${request.headers.host}`)
  const match = url.pathname.match(/^\/api\/v1\/expenses(?:\/([^/]+))?$/)

  if (request.method === 'GET' && url.pathname === '/health') return send(response, 200, { status: 'ok' })
  if (!match) return send(response, 404, { detail: 'Rota não encontrada' })
  if (request.method === 'GET') return send(response, 200, expenses)

  if (request.method === 'POST' || request.method === 'PUT') {
    const payload = validateExpense(await readBody(request))
    if (!payload) return send(response, 400, { detail: 'Dados da despesa inválidos' })
    if (request.method === 'POST') {
      const expense = { id: randomUUID(), ...payload }
      expenses.push(expense)
      return send(response, 201, expense)
    }
    const index = expenses.findIndex((expense) => expense.id === match[1])
    if (index === -1) return send(response, 404, { detail: 'Despesa não encontrada' })
    expenses[index] = { id: match[1], ...payload }
    return send(response, 200, expenses[index])
  }

  if (request.method === 'DELETE') {
    const index = expenses.findIndex((expense) => expense.id === match[1])
    if (index === -1) return send(response, 404, { detail: 'Despesa não encontrada' })
    expenses.splice(index, 1)
    return send(response, 204)
  }
  return send(response, 405, { detail: 'Método não permitido' })
})

server.listen(port, () => console.log(`Expense Monitor API rodando em http://localhost:${port}`))
