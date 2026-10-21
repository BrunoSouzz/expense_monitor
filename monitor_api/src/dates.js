export const FREQUENCIES = ['weekly', 'monthly', 'yearly']

const pad = (value, size = 2) => String(value).padStart(size, '0')

/** Data local (não UTC) no formato AAAA-MM-DD. Evita "amanhã" depois das 21h no Brasil. */
export function localDate(now = new Date()) {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1970 || year > 2200) return false
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

export function isValidMonth(value) {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

/** Intervalo [início, fim) de um mês AAAA-MM, útil para filtrar por data sem perder índice. */
export function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const [nextYear, nextMonth] = monthNumber === 12 ? [year + 1, 1] : [year, monthNumber + 1]
  return [`${month}-01`, `${pad(nextYear, 4)}-${pad(nextMonth)}-01`]
}

/**
 * Soma uma periodicidade a uma data. Em recorrências mensais/anuais o dia é limitado ao
 * último dia do mês (31/01 + 1 mês = 28/02) sem "vazar" para o mês seguinte e sem
 * acumular deslocamento: o dia-âncora original é restaurado quando o mês permite.
 */
export function addPeriod(dateValue, frequency, anchorDay = Number(dateValue.slice(8, 10))) {
  const [year, month, day] = dateValue.split('-').map(Number)
  if (frequency === 'weekly') {
    const next = new Date(Date.UTC(year, month - 1, day + 7))
    return `${pad(next.getUTCFullYear(), 4)}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
  }
  const totalMonths = year * 12 + (month - 1) + (frequency === 'yearly' ? 12 : 1)
  const nextYear = Math.floor(totalMonths / 12)
  const nextMonth = totalMonths % 12
  const lastDay = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate()
  return `${pad(nextYear, 4)}-${pad(nextMonth + 1)}-${pad(Math.min(anchorDay, lastDay))}`
}
