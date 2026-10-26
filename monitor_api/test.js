process.env.NODE_ENV = 'test'
import os from 'node:os'
import path from 'node:path'
process.env.EXPENSE_MONITOR_DATA_DIR = path.join(os.tmpdir(), `expense-monitor-test-${Date.now()}`)

import test from 'node:test'
import assert from 'node:assert/strict'
import { createExpenseServer } from './server.js'
import { createExpenseServer as createServerFromMain } from './main.js'

test('API Endpoints and Functionality', async (t) => {
  assert.equal(typeof createServerFromMain, 'function')
  const server = createExpenseServer()

  await new Promise((resolve) => server.listen(0, resolve))
  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}`

  t.after(() => {
    server.close()
  })

  await t.test('GET / returns documentation', async () => {
    const res = await fetch(`${baseUrl}/`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.name, 'Expense Monitor API')
    assert.ok(data.endpoints)
  })

  await t.test('GET /health returns status ok', async () => {
    const res = await fetch(`${baseUrl}/health`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'ok')
  })

  await t.test('PUT and GET /api/v1/balance', async () => {
    const putRes = await fetch(`${baseUrl}/api/v1/balance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialBalance: 2500 }),
    })
    assert.equal(putRes.status, 200)
    const putData = await putRes.json()
    assert.equal(putData.initialBalance, 2500)

    const getRes = await fetch(`${baseUrl}/api/v1/balance`)
    assert.equal(getRes.status, 200)
    const getData = await getRes.json()
    assert.equal(getData.initialBalance, 2500)
  })

  let createdExpenseId = null

  await t.test('POST /api/v1/expenses creates expense with pending status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Internet Fibra',
        amount: 120.50,
        category: 'Moradia',
        paymentMethod: 'Pix',
        notes: 'Vence dia 10',
        status: 'pending',
        recurring: false,
        date: '2026-10-10',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.ok(data.id)
    assert.equal(data.description, 'Internet Fibra')
    assert.equal(data.status, 'pending')
    createdExpenseId = data.id
  })

  await t.test('PATCH /api/v1/expenses/:id/toggle-status toggles status to paid', async () => {
    assert.ok(createdExpenseId)
    const res = await fetch(`${baseUrl}/api/v1/expenses/${createdExpenseId}/toggle-status`, {
      method: 'PATCH',
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'paid')
  })

  await t.test('Income CRUD operations', async () => {
    const postRes = await fetch(`${baseUrl}/api/v1/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Salário',
        amount: 5000,
        recurring: true,
        recurringFrequency: 'monthly',
        date: '2026-10-05',
      }),
    })
    assert.equal(postRes.status, 201)
    const income = await postRes.json()
    assert.ok(income.id)
    assert.equal(income.name, 'Salário')

    const getRes = await fetch(`${baseUrl}/api/v1/income`)
    assert.equal(getRes.status, 200)
    const list = await getRes.json()
    assert.ok(list.some((item) => item.id === income.id))

    const deleteRes = await fetch(`${baseUrl}/api/v1/income/${income.id}`, { method: 'DELETE' })
    assert.equal(deleteRes.status, 204)
  })

  await t.test('POST /api/v1/recurring/process triggers recurring check', async () => {
    const res = await fetch(`${baseUrl}/api/v1/recurring/process`, { method: 'POST' })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.processed)
  })

  await t.test('GET /api/v1/summary returns calculated metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/summary?month=2026-10`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(typeof data.initialBalance, 'number')
    assert.equal(typeof data.totalExpenses, 'number')
    assert.equal(typeof data.projectedBalance, 'number')
    assert.ok(Array.isArray(data.byCategory))
  })

  await t.test('DELETE /api/v1/expenses/:id removes expense', async () => {
    const res = await fetch(`${baseUrl}/api/v1/expenses/${createdExpenseId}`, {
      method: 'DELETE',
    })
    assert.equal(res.status, 204)
  })

  await t.test('POST /api/v1/expenses creates installments across future months', async () => {
    const res = await fetch(`${baseUrl}/api/v1/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Smartphone Novo',
        amount: 300,
        category: 'Compras Pessoais',
        paymentMethod: 'Cartão de crédito',
        date: '2026-10-15',
        status: 'paid',
        installments: 3,
        installmentType: 'total',
      }),
    })
    assert.equal(res.status, 201)
    const firstInst = await res.json()
    assert.ok(firstInst.description.includes('(1/3)'))
    assert.equal(firstInst.amount, 100)
    assert.equal(firstInst.date, '2026-10-15')

    // Check that month 2026-11 has installment 2/3
    const novRes = await fetch(`${baseUrl}/api/v1/expenses?month=2026-11`)
    const novList = await novRes.json()
    const secondInst = novList.find((e) => e.description.includes('Smartphone Novo (2/3)'))
    assert.ok(secondInst)
    assert.equal(secondInst.amount, 100)
    assert.equal(secondInst.status, 'pending')
    assert.equal(secondInst.date, '2026-11-15')

    // Check that month 2026-12 has installment 3/3
    const decRes = await fetch(`${baseUrl}/api/v1/expenses?month=2026-12`)
    const decList = await decRes.json()
    const thirdInst = decList.find((e) => e.description.includes('Smartphone Novo (3/3)'))
    assert.ok(thirdInst)
    assert.equal(thirdInst.amount, 100)
    assert.equal(thirdInst.status, 'pending')
    assert.equal(thirdInst.date, '2026-12-15')
  })

  await t.test('Automatic month rollover carries leftover balance forward', async () => {
    // Set base balance to 1000
    await fetch(`${baseUrl}/api/v1/balance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialBalance: 1000 }),
    })

    // Get balance for November: should carry over base balance minus October expenses plus October incomes
    const balNovRes = await fetch(`${baseUrl}/api/v1/balance?month=2026-11`)
    assert.equal(balNovRes.status, 200)
    const balNov = await balNovRes.json()
    assert.ok(typeof balNov.initialBalance === 'number')

    // Summary for November should include rollover in initialBalance
    const sumNovRes = await fetch(`${baseUrl}/api/v1/summary?month=2026-11`)
    assert.equal(sumNovRes.status, 200)
    const sumNov = await sumNovRes.json()
    assert.equal(sumNov.initialBalance, balNov.initialBalance)
  })

  await t.test('GET /api/v1/expenses?status=overdue returns overdue items', async () => {
    // Create an expense with past date and pending status
    const res = await fetch(`${baseUrl}/api/v1/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Boleto Vencido',
        amount: 85,
        category: 'Contas',
        paymentMethod: 'Boleto bancário',
        date: '2020-01-10',
        status: 'pending',
      }),
    })
    assert.equal(res.status, 201)
    const overdueExpense = await res.json()

    const overdueRes = await fetch(`${baseUrl}/api/v1/expenses?status=overdue`)
    assert.equal(overdueRes.status, 200)
    const overdueList = await overdueRes.json()
    assert.ok(overdueList.some((e) => e.id === overdueExpense.id))
  })
})
