import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createApp } from '../src/app.js'
import { addPeriod, isValidDate, localDate, monthRange } from '../src/dates.js'

const TODAY = '2026-10-20'
const workDir = mkdtempSync(path.join(tmpdir(), 'expense-monitor-test-'))
const staticDir = path.join(workDir, 'dist')
mkdirSync(path.join(staticDir, 'assets'), { recursive: true })
writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><title>spa</title>')
writeFileSync(path.join(staticDir, 'assets', 'app.js'), 'console.log(1)')

let app
let base
let clockValue = TODAY

const json = (payload) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
const call = async (pathname, options) => {
  const response = await fetch(`${base}${pathname}`, options)
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers }
}
const rawRequest = (options, body) => new Promise((resolve, reject) => {
  const url = new URL(base)
  const request = http.request({ host: url.hostname, port: url.port, ...options }, (response) => {
    let data = ''
    response.on('data', (chunk) => { data += chunk })
    response.on('end', () => resolve({ status: response.statusCode, body: data, headers: response.headers }))
  })
  request.on('error', reject)
  request.end(body)
})

const expense = (overrides = {}) => ({
  description: 'Mercado', amount: 10.5, category: 'Alimentação', paymentMethod: 'Pix',
  notes: '', recurring: false, recurringFrequency: 'weekly', date: '2026-10-05', ...overrides,
})

before(async () => {
  app = createApp({ dataDir: path.join(workDir, 'data'), staticDir, clock: () => clockValue })
  base = `http://127.0.0.1:${await app.listen(0)}`
})

after(async () => {
  await app.close()
  rmSync(workDir, { recursive: true, force: true })
})

describe('datas', () => {
  test('addPeriod limita o dia ao fim do mês e volta ao dia-âncora', () => {
    assert.equal(addPeriod('2026-01-31', 'monthly'), '2026-02-28')
    assert.equal(addPeriod('2028-01-31', 'monthly'), '2028-02-29')
    assert.equal(addPeriod('2026-02-28', 'monthly', 31), '2026-03-31')
    assert.equal(addPeriod('2028-02-29', 'yearly'), '2029-02-28')
    assert.equal(addPeriod('2026-12-15', 'monthly'), '2027-01-15')
    assert.equal(addPeriod('2026-12-28', 'weekly'), '2027-01-04')
  })

  test('isValidDate rejeita datas impossíveis', () => {
    assert.equal(isValidDate('2026-02-30'), false)
    assert.equal(isValidDate('2026-13-01'), false)
    assert.equal(isValidDate('lixo'), false)
    assert.equal(isValidDate('2026-10-20'), true)
  })

  test('localDate usa o calendário local, não o UTC', () => {
    assert.equal(localDate(new Date(2026, 9, 20, 23, 30)), '2026-10-20')
  })

  test('monthRange vira o ano', () => {
    assert.deepEqual(monthRange('2026-12'), ['2026-12-01', '2027-01-01'])
  })
})

describe('despesas', () => {
  test('health responde ok', async () => {
    const { status, body } = await call('/health')
    assert.equal(status, 200)
    assert.deepEqual(body, { status: 'ok' })
  })

  test('cria, lista, edita e remove', async () => {
    const created = await call('/api/v1/expenses', json(expense()))
    assert.equal(created.status, 201)
    assert.equal(created.body.amount, 10.5)
    assert.equal(created.body.recurring, false)
    assert.equal(created.body.nextChargeDate, null)

    const updated = await call(`/api/v1/expenses/${created.body.id}`, { ...json(expense({ description: 'Feira', amount: '12,30' })), method: 'PUT' })
    assert.equal(updated.status, 200)
    assert.equal(updated.body.description, 'Feira')
    assert.equal(updated.body.amount, 12.3)

    const list = await call('/api/v1/expenses')
    assert.ok(list.body.some((item) => item.id === created.body.id && item.description === 'Feira'))

    assert.equal((await call(`/api/v1/expenses/${created.body.id}`, { method: 'DELETE' })).status, 204)
    assert.equal((await call(`/api/v1/expenses/${created.body.id}`, { method: 'DELETE' })).status, 404)
    assert.equal((await call('/api/v1/expenses/nao-existe', { ...json(expense()), method: 'PUT' })).status, 404)
  })

  test('rejeita dados inválidos com mensagem clara', async () => {
    for (const bad of [
      expense({ amount: 0 }), expense({ amount: -3 }), expense({ amount: 'abc' }), expense({ amount: true }),
      expense({ description: '   ' }), expense({ date: '2026-02-30' }), expense({ recurring: 'sim' }),
      expense({ recurring: true, recurringFrequency: 'daily' }),
    ]) {
      const { status, body } = await call('/api/v1/expenses', json(bad))
      assert.equal(status, 400, JSON.stringify(bad))
      assert.equal(typeof body.detail, 'string')
    }
  })

  test('ignora nextChargeDate vindo do cliente (não quebra o servidor)', async () => {
    const created = await call('/api/v1/expenses', json(expense({ recurring: true, recurringFrequency: 'monthly', nextChargeDate: 'lixo' })))
    assert.equal(created.status, 201)
    assert.equal(created.body.nextChargeDate, '2026-11-05')
    assert.equal((await call('/health')).status, 200)
  })

  test('JSON inválido → 400; sem Content-Type JSON → 415; corpo grande → 413', async () => {
    assert.equal((await call('/api/v1/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{quebrado' })).status, 400)
    assert.equal((await call('/api/v1/expenses', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(expense()) })).status, 415)
    const big = await rawRequest({ method: 'POST', path: '/api/v1/expenses', headers: { 'Content-Type': 'application/json', Connection: 'close' } }, JSON.stringify(expense({ notes: 'x'.repeat(200_000) })))
    assert.equal(big.status, 413)
  })

  test('filtro por mês e validação do parâmetro', async () => {
    await call('/api/v1/expenses', json(expense({ description: 'Setembro', date: '2026-09-30' })))
    await call('/api/v1/expenses', json(expense({ description: 'Outubro', date: '2026-10-01' })))
    const september = await call('/api/v1/expenses?month=2026-09')
    assert.ok(september.body.length >= 1)
    assert.ok(september.body.every((item) => item.date.startsWith('2026-09')))
    assert.equal((await call('/api/v1/expenses?month=2026-13')).status, 400)
  })
})

describe('recorrências', () => {
  test('gera cada período vencido na própria data e não duplica', async () => {
    const template = await call('/api/v1/expenses', json(expense({
      description: 'Academia', amount: 100, recurring: true, recurringFrequency: 'monthly', date: '2026-07-31',
    })))
    assert.equal(template.body.nextChargeDate, '2026-08-31')

    const first = await call('/api/v1/recurring/process', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    assert.equal(first.status, 200)
    assert.equal(first.body.processed.expenses, 2) // 31/08 e 30/09 (31/10 ainda não venceu)

    const charges = (await call('/api/v1/expenses')).body.filter((item) => item.description === 'Academia' && !item.recurring)
    assert.deepEqual(charges.map((item) => item.date).sort(), ['2026-08-31', '2026-09-30'])
    assert.ok(charges.every((item) => item.notes.includes('Gerada pela recorrência')))

    const again = await call('/api/v1/recurring/process', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    assert.equal(again.body.processed.expenses, 0)

    const reloaded = (await call('/api/v1/expenses')).body.find((item) => item.id === template.body.id)
    assert.equal(reloaded.nextChargeDate, '2026-10-31')

    clockValue = '2026-10-31'
    const later = await call('/api/v1/recurring/process', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    assert.equal(later.body.processed.expenses, 1)
    clockValue = TODAY
  })

  test('editar a descrição não reinicia o calendário', async () => {
    const created = await call('/api/v1/expenses', json(expense({ recurring: true, recurringFrequency: 'weekly', date: '2026-10-19' })))
    assert.equal(created.body.nextChargeDate, '2026-10-26')
    const edited = await call(`/api/v1/expenses/${created.body.id}`, { ...json(expense({ description: 'Outro nome', recurring: true, recurringFrequency: 'weekly', date: '2026-10-19' })), method: 'PUT' })
    assert.equal(edited.body.nextChargeDate, '2026-10-26')
    const changed = await call(`/api/v1/expenses/${created.body.id}`, { ...json(expense({ recurring: true, recurringFrequency: 'monthly', date: '2026-10-19' })), method: 'PUT' })
    assert.equal(changed.body.nextChargeDate, '2026-11-19')
    const stopped = await call(`/api/v1/expenses/${created.body.id}`, { ...json(expense({ recurring: false, date: '2026-10-19' })), method: 'PUT' })
    assert.equal(stopped.body.nextChargeDate, null)
  })

  test('entradas recorrentes também são processadas', async () => {
    const created = await call('/api/v1/income', json({ name: 'Salário', amount: 3000, recurring: true, recurringFrequency: 'monthly', date: '2026-09-20' }))
    assert.equal(created.status, 201)
    assert.equal(created.body.nextCreditDate, '2026-10-20')
    const processed = await call('/api/v1/recurring/process', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    assert.equal(processed.body.processed.income, 1)
    const credits = (await call('/api/v1/income')).body.filter((item) => item.name === 'Salário')
    assert.equal(credits.length, 2)
  })
})

describe('entradas e resumo', () => {
  test('CRUD de entradas com data padrão = hoje', async () => {
    const created = await call('/api/v1/income', json({ name: 'Mesada', amount: 200 }))
    assert.equal(created.status, 201)
    assert.equal(created.body.date, TODAY)
    const updated = await call(`/api/v1/income/${created.body.id}`, { ...json({ name: 'Mesada extra', amount: 250.5 }), method: 'PUT' })
    assert.equal(updated.body.name, 'Mesada extra')
    assert.equal(updated.body.amount, 250.5)
    assert.equal((await call(`/api/v1/income/${created.body.id}`, { method: 'DELETE' })).status, 204)
    assert.equal((await call(`/api/v1/income/${created.body.id}`, { method: 'DELETE' })).status, 404)
    assert.equal((await call('/api/v1/income', json({ name: '', amount: 5 }))).status, 400)
  })

  test('resumo soma em centavos, agrupa por categoria e calcula o saldo', async () => {
    const isolated = createApp({ dataDir: path.join(workDir, 'summary'), clock: () => TODAY })
    const root = `http://127.0.0.1:${await isolated.listen(0)}`
    const send = (pathname, payload) => fetch(`${root}${pathname}`, json(payload))
    await send('/api/v1/expenses', expense({ amount: 0.1, category: 'A', date: '2026-10-01' }))
    await send('/api/v1/expenses', expense({ amount: 0.2, category: 'A', date: '2026-10-02' }))
    await send('/api/v1/expenses', expense({ amount: 0.7, category: 'B', date: '2026-10-03' }))
    await send('/api/v1/expenses', expense({ amount: 50, category: 'B', date: '2026-09-03' }))
    await send('/api/v1/income', { name: 'Salário', amount: 100, date: '2026-09-01' })

    const month = await (await fetch(`${root}/api/v1/summary?month=2026-10`)).json()
    assert.equal(month.spent.total, 1) // 0.1 + 0.2 + 0.7 sem erro de ponto flutuante
    assert.equal(month.spent.count, 3)
    assert.deepEqual(month.spent.byCategory.map((item) => [item.category, item.total, item.percentage]), [['B', 0.7, 70], ['A', 0.3, 30]])
    assert.equal(month.income.total, 100)
    assert.equal(month.balance, 49)

    const all = await (await fetch(`${root}/api/v1/summary`)).json()
    assert.equal(all.period, null)
    assert.equal(all.spent.total, 51)
    assert.equal((await fetch(`${root}/api/v1/summary?month=abc`)).status, 400)
    await isolated.close()
  })
})

describe('segurança e front-end', () => {
  test('recusa Host de outro domínio (DNS rebinding) e origens desconhecidas', async () => {
    assert.equal((await rawRequest({ method: 'GET', path: '/health', headers: { Host: 'evil.example.com' } })).status, 403)
    assert.equal((await rawRequest({ method: 'GET', path: '/health', headers: { Origin: 'https://evil.example.com' } })).status, 403)
  })

  test('libera CORS apenas para a origem de desenvolvimento', async () => {
    const preflight = await rawRequest({ method: 'OPTIONS', path: '/api/v1/expenses', headers: { Origin: 'http://localhost:5173' } })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.headers['access-control-allow-origin'], 'http://localhost:5173')
  })

  test('rota desconhecida e método errado', async () => {
    assert.equal((await call('/api/v1/nada')).status, 404)
    assert.equal((await call('/api/v2/expenses')).status, 404)
    const wrong = await call('/api/v1/summary', json({}))
    assert.equal(wrong.status, 405)
    assert.equal(wrong.headers.get('allow'), 'GET')
  })

  test('serve o front-end com fallback de SPA e sem path traversal', async () => {
    const home = await rawRequest({ method: 'GET', path: '/' })
    assert.equal(home.status, 200)
    assert.match(home.body, /spa/)
    assert.match(home.headers['content-security-policy'], /default-src 'self'/)
    assert.equal((await rawRequest({ method: 'GET', path: '/algum/caminho' })).status, 200)
    const asset = await rawRequest({ method: 'GET', path: '/assets/app.js' })
    assert.equal(asset.status, 200)
    assert.match(asset.headers['content-type'], /javascript/)
    assert.equal((await rawRequest({ method: 'GET', path: '/assets/nao-existe.js' })).status, 404)
    const traversal = await rawRequest({ method: 'GET', path: '/..%2f..%2f..%2fetc/passwd' })
    assert.ok(!traversal.body.includes('root:'))
    assert.equal((await rawRequest({ method: 'GET', path: '/%00' })).status, 400)
  })
})

describe('migração', () => {
  test('abre um banco criado pela versão antiga e preserva os dados', async () => {
    const legacyDir = path.join(workDir, 'legacy')
    mkdirSync(legacyDir)
    const legacy = new DatabaseSync(path.join(legacyDir, 'expense-monitor.db'))
    legacy.exec(`
      CREATE TABLE expenses (id TEXT PRIMARY KEY, description TEXT NOT NULL, amount REAL NOT NULL CHECK (amount > 0),
        category TEXT NOT NULL, payment_method TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', recurring INTEGER NOT NULL DEFAULT 0, date TEXT NOT NULL);
      CREATE TABLE income_sources (id TEXT PRIMARY KEY, name TEXT NOT NULL, amount REAL NOT NULL CHECK (amount > 0));
      INSERT INTO expenses VALUES ('e1', 'Antiga', 20, 'Lazer', 'Pix', '', 0, '2026-01-10');
      INSERT INTO income_sources VALUES ('i1', 'Salário antigo', 1000);
    `)
    legacy.close()

    const migrated = createApp({ dataDir: legacyDir, clock: () => TODAY })
    const root = `http://127.0.0.1:${await migrated.listen(0)}`
    const expenses = await (await fetch(`${root}/api/v1/expenses`)).json()
    const income = await (await fetch(`${root}/api/v1/income`)).json()
    assert.equal(expenses[0].description, 'Antiga')
    assert.equal(expenses[0].recurringFrequency, 'weekly')
    assert.equal(income[0].name, 'Salário antigo')
    assert.equal(typeof income[0].date, 'string')
    const summary = await (await fetch(`${root}/api/v1/summary`)).json()
    assert.equal(summary.balance, 980)
    await migrated.close()
  })
})
