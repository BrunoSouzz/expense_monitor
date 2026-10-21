export const CATEGORIES = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Outros']
export const PAYMENT_METHODS = ['Cartão de débito', 'Cartão de crédito', 'Pix', 'Dinheiro', 'Transferência', 'Outro']
export const FREQUENCY_LABELS = { weekly: 'semanal', monthly: 'mensal', yearly: 'anual' }

const pad = (value) => String(value).padStart(2, '0')

export const formatCurrency = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Data local de hoje (AAAA-MM-DD). `toISOString()` usaria UTC e viraria "amanhã" à noite no Brasil. */
export function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const currentMonth = () => todayISO().slice(0, 7)

export function shiftMonth(month, delta) {
  const [year, number] = month.split('-').map(Number)
  const total = year * 12 + (number - 1) + delta
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

/** "outubro de 2026" */
export function monthLabel(month) {
  const [year, number] = month.split('-').map(Number)
  return new Date(year, number - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

/** "outubro" */
export function monthName(month) {
  const [year, number] = month.split('-').map(Number)
  return new Date(year, number - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
}

/** "2026-10-05" → "05/10/2026" (sem passar por Date, para não sofrer com fuso horário). */
export function formatDate(iso) {
  const [year, month, day] = String(iso).split('-')
  return `${day}/${month}/${year}`
}

export const plural = (count, singular, pluralForm) => `${count} ${count === 1 ? singular : pluralForm}`
