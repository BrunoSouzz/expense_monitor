import { randomUUID } from 'node:crypto'
import { addPeriod, monthRange } from './dates.js'
import { inTransaction } from './db.js'

// Valores em centavos inteiros: somar REAL (0.1 + 0.2) acumula erro de ponto flutuante.
const CENTS = 'CAST(ROUND(amount * 100) AS INTEGER)'
const MAX_CATCH_UP = 366

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
  date: row.date,
})

export function createStore(db, clock) {
  const statements = {
    listExpenses: db.prepare('SELECT * FROM expenses ORDER BY date DESC, rowid DESC'),
    listExpensesByMonth: db.prepare('SELECT * FROM expenses WHERE date >= ? AND date < ? ORDER BY date DESC, rowid DESC'),
    getExpense: db.prepare('SELECT * FROM expenses WHERE id = ?'),
    insertExpense: db.prepare(`
      INSERT INTO expenses (id, description, amount, category, payment_method, notes, recurring, recurring_frequency, next_charge_date, date)
      VALUES (@id, @description, @amount, @category, @paymentMethod, @notes, @recurring, @recurringFrequency, @nextChargeDate, @date)
    `),
    updateExpense: db.prepare(`
      UPDATE expenses
      SET description = @description, amount = @amount, category = @category, payment_method = @paymentMethod,
          notes = @notes, recurring = @recurring, recurring_frequency = @recurringFrequency,
          next_charge_date = @nextChargeDate, date = @date
      WHERE id = @id
    `),
    deleteExpense: db.prepare('DELETE FROM expenses WHERE id = ?'),
    dueExpenses: db.prepare('SELECT * FROM expenses WHERE recurring = 1 AND next_charge_date IS NOT NULL AND next_charge_date <= ? ORDER BY next_charge_date'),
    advanceExpense: db.prepare('UPDATE expenses SET next_charge_date = ? WHERE id = ?'),

    listIncome: db.prepare('SELECT * FROM income_sources ORDER BY date DESC, rowid DESC'),
    getIncome: db.prepare('SELECT * FROM income_sources WHERE id = ?'),
    insertIncome: db.prepare(`
      INSERT INTO income_sources (id, name, amount, recurring, recurring_frequency, next_credit_date, date)
      VALUES (@id, @name, @amount, @recurring, @recurringFrequency, @nextCreditDate, @date)
    `),
    updateIncome: db.prepare(`
      UPDATE income_sources
      SET name = @name, amount = @amount, recurring = @recurring, recurring_frequency = @recurringFrequency,
          next_credit_date = @nextCreditDate, date = @date
      WHERE id = @id
    `),
    deleteIncome: db.prepare('DELETE FROM income_sources WHERE id = ?'),
    dueIncome: db.prepare('SELECT * FROM income_sources WHERE recurring = 1 AND next_credit_date IS NOT NULL AND next_credit_date <= ? ORDER BY next_credit_date'),
    advanceIncome: db.prepare('UPDATE income_sources SET next_credit_date = ? WHERE id = ?'),

    totalExpenses: db.prepare(`SELECT COALESCE(SUM(${CENTS}), 0) AS cents, COUNT(*) AS count FROM expenses`),
    totalExpensesByMonth: db.prepare(`SELECT COALESCE(SUM(${CENTS}), 0) AS cents, COUNT(*) AS count FROM expenses WHERE date >= ? AND date < ?`),
    categories: db.prepare(`SELECT category, SUM(${CENTS}) AS cents, COUNT(*) AS count FROM expenses GROUP BY category ORDER BY cents DESC, category`),
    categoriesByMonth: db.prepare(`SELECT category, SUM(${CENTS}) AS cents, COUNT(*) AS count FROM expenses WHERE date >= ? AND date < ? GROUP BY category ORDER BY cents DESC, category`),
    totalIncome: db.prepare(`SELECT COALESCE(SUM(${CENTS}), 0) AS cents, COUNT(*) AS count FROM income_sources`),
  }

  const expenseParams = (id, value, nextChargeDate) => ({
    id,
    description: value.description,
    amount: value.amount,
    category: value.category,
    paymentMethod: value.paymentMethod,
    notes: value.notes,
    recurring: Number(value.recurring),
    recurringFrequency: value.recurringFrequency,
    nextChargeDate,
    date: value.date,
  })

  const incomeParams = (id, value, nextCreditDate) => ({
    id,
    name: value.name,
    amount: value.amount,
    recurring: Number(value.recurring),
    recurringFrequency: value.recurringFrequency,
    nextCreditDate,
    date: value.date,
  })

  return {
    listExpenses(month) {
      const rows = month ? statements.listExpensesByMonth.all(...monthRange(month)) : statements.listExpenses.all()
      return rows.map(expenseFromRow)
    },

    createExpense(value) {
      const id = randomUUID()
      const nextChargeDate = value.recurring ? addPeriod(value.date, value.recurringFrequency) : null
      statements.insertExpense.run(expenseParams(id, value, nextChargeDate))
      return expenseFromRow(statements.getExpense.get(id))
    },

    updateExpense(id, value) {
      const existing = statements.getExpense.get(id)
      if (!existing) return null
      // Editar só a descrição não deve reiniciar o calendário da cobrança.
      const keepSchedule = existing.recurring && existing.recurring_frequency === value.recurringFrequency
        && existing.date === value.date && existing.next_charge_date
      const nextChargeDate = !value.recurring ? null : keepSchedule ? existing.next_charge_date : addPeriod(value.date, value.recurringFrequency)
      statements.updateExpense.run(expenseParams(id, value, nextChargeDate))
      return expenseFromRow(statements.getExpense.get(id))
    },

    deleteExpense: (id) => statements.deleteExpense.run(id).changes > 0,

    listIncome: () => statements.listIncome.all().map(incomeFromRow),

    createIncome(value) {
      const id = randomUUID()
      const nextCreditDate = value.recurring ? addPeriod(value.date, value.recurringFrequency) : null
      statements.insertIncome.run(incomeParams(id, value, nextCreditDate))
      return incomeFromRow(statements.getIncome.get(id))
    },

    updateIncome(id, value) {
      const existing = statements.getIncome.get(id)
      if (!existing) return null
      const keepSchedule = existing.recurring && existing.recurring_frequency === value.recurringFrequency
        && existing.date === value.date && existing.next_credit_date
      const nextCreditDate = !value.recurring ? null : keepSchedule ? existing.next_credit_date : addPeriod(value.date, value.recurringFrequency)
      statements.updateIncome.run(incomeParams(id, value, nextCreditDate))
      return incomeFromRow(statements.getIncome.get(id))
    },

    deleteIncome: (id) => statements.deleteIncome.run(id).changes > 0,

    /**
     * Resumo calculado no banco, em centavos inteiros. As despesas respeitam o mês quando
     * informado; o saldo considera todas as entradas menos todas as despesas.
     */
    summary(month) {
      const range = month ? monthRange(month) : []
      const spent = month ? statements.totalExpensesByMonth.get(...range) : statements.totalExpenses.get()
      const categories = month ? statements.categoriesByMonth.all(...range) : statements.categories.all()
      const allExpenses = statements.totalExpenses.get()
      const income = statements.totalIncome.get()
      return {
        period: month ?? null,
        spent: {
          total: spent.cents / 100,
          count: spent.count,
          byCategory: categories.map((row) => ({
            category: row.category,
            total: row.cents / 100,
            count: row.count,
            percentage: spent.cents ? Math.round((row.cents / spent.cents) * 1000) / 10 : 0,
          })),
        },
        income: { total: income.cents / 100, count: income.count },
        balance: (income.cents - allExpenses.cents) / 100,
      }
    },

    /**
     * Gera os lançamentos vencidos das recorrências (despesas e entradas). Cada período
     * em atraso vira um lançamento na sua própria data; chamar de novo no mesmo dia não
     * duplica nada. Só roda quando o usuário pede.
     */
    processRecurring() {
      const today = clock()
      return inTransaction(db, () => {
        let expenses = 0
        for (const source of statements.dueExpenses.all(today)) {
          const anchorDay = Number(source.date.slice(8, 10))
          let next = source.next_charge_date
          for (let guard = 0; next <= today && guard < MAX_CATCH_UP; guard += 1) {
            statements.insertExpense.run(expenseParams(randomUUID(), {
              description: source.description,
              amount: source.amount,
              category: source.category,
              paymentMethod: source.payment_method,
              notes: `${source.notes ? `${source.notes} · ` : ''}Gerada pela recorrência.`.slice(0, 240),
              recurring: false,
              recurringFrequency: source.recurring_frequency,
              date: next,
            }, null))
            expenses += 1
            next = addPeriod(next, source.recurring_frequency, anchorDay)
          }
          statements.advanceExpense.run(next, source.id)
        }

        let income = 0
        for (const source of statements.dueIncome.all(today)) {
          const anchorDay = Number(source.date.slice(8, 10))
          let next = source.next_credit_date
          for (let guard = 0; next <= today && guard < MAX_CATCH_UP; guard += 1) {
            statements.insertIncome.run(incomeParams(randomUUID(), {
              name: source.name,
              amount: source.amount,
              recurring: false,
              recurringFrequency: source.recurring_frequency,
              date: next,
            }, null))
            income += 1
            next = addPeriod(next, source.recurring_frequency, anchorDay)
          }
          statements.advanceIncome.run(next, source.id)
        }
        return { expenses, income }
      })
    },
  }
}
