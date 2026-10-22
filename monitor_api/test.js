process.env.NODE_ENV = 'test'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createExpenseServer } from './server.js'

test('API Endpoints and Functionality', async (t) => {
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
})
