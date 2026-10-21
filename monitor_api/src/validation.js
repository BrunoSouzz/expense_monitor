import { FREQUENCIES, isValidDate } from './dates.js'

const MAX_AMOUNT = 1_000_000_000

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

function toAmount(raw) {
  if (typeof raw !== 'number' && typeof raw !== 'string') return NaN
  const value = typeof raw === 'string' ? Number(raw.trim().replace(',', '.') || NaN) : raw
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : NaN
}

const invalid = (error) => ({ error })

/** Valida e normaliza uma despesa. Retorna { value } ou { error }. */
export function validateExpense(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid('Corpo da requisição inválido.')
  const description = text(body.description, 120)
  if (!description) return invalid('Informe uma descrição.')
  const amount = toAmount(body.amount)
  if (!(amount >= 0.01 && amount <= MAX_AMOUNT)) return invalid('Informe um valor maior que zero.')
  const category = text(body.category, 40)
  if (!category) return invalid('Informe uma categoria.')
  const paymentMethod = text(body.paymentMethod, 40)
  if (!paymentMethod) return invalid('Informe a forma de pagamento.')
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') return invalid('Observações inválidas.')
  const recurring = body.recurring ?? false
  if (typeof recurring !== 'boolean') return invalid('Recorrência inválida.')
  if (recurring && !FREQUENCIES.includes(body.recurringFrequency)) return invalid('Escolha a periodicidade da recorrência.')
  if (!isValidDate(body.date)) return invalid('Informe uma data válida.')
  return {
    value: {
      description,
      amount,
      category,
      paymentMethod,
      notes: text(body.notes, 240),
      recurring,
      recurringFrequency: FREQUENCIES.includes(body.recurringFrequency) ? body.recurringFrequency : 'weekly',
      date: body.date,
    },
  }
}

/** Valida e normaliza uma entrada. `today` é usado quando a data não é informada. */
export function validateIncome(body, today) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid('Corpo da requisição inválido.')
  const name = text(body.name, 60)
  if (!name) return invalid('Informe o nome da entrada.')
  const amount = toAmount(body.amount)
  if (!(amount >= 0.01 && amount <= MAX_AMOUNT)) return invalid('Informe um valor maior que zero.')
  const recurring = body.recurring ?? false
  if (typeof recurring !== 'boolean') return invalid('Recorrência inválida.')
  if (recurring && !FREQUENCIES.includes(body.recurringFrequency)) return invalid('Escolha a periodicidade da recorrência.')
  const date = body.date ?? today
  if (!isValidDate(date)) return invalid('Informe uma data válida.')
  return {
    value: {
      name,
      amount,
      recurring,
      recurringFrequency: FREQUENCIES.includes(body.recurringFrequency) ? body.recurringFrequency : 'monthly',
      date,
    },
  }
}
