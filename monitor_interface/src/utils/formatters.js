/**
 * Utility functions for formatting currency and dates
 */

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatMonthLabel(monthIso, viewAll = false) {
  if (viewAll) return 'Todo o período'
  if (!monthIso) return 'Mês selecionado'
  const [yearStr, monthStr] = monthIso.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return monthName.charAt(0).toUpperCase() + monthName.slice(1)
}

export function getCurrentMonthIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
