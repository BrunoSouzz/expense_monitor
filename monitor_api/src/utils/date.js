export const isValidDate = (value) => {
  if (!value || typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && (date.getUTCMonth() + 1) === m && date.getUTCDate() === d
}

export const getTodayIso = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const addMonthsSafe = (dateStr, monthsToAdd) => {
  if (!isValidDate(dateStr)) return dateStr
  const [y, m, d] = dateStr.split('-').map(Number)
  const totalMonths = (m - 1) + monthsToAdd
  const targetYear = y + Math.floor(totalMonths / 12)
  const targetMonth = ((totalMonths % 12) + 12) % 12 + 1
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
  const targetDay = Math.min(d, daysInTargetMonth)
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
}

export const addDaysSafe = (dateStr, daysToAdd) => {
  if (!isValidDate(dateStr)) return dateStr
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + daysToAdd)
  return date.toISOString().slice(0, 10)
}

export const addPeriod = (dateValue, frequency) => {
  if (frequency === 'monthly') {
    return addMonthsSafe(dateValue, 1)
  }
  if (frequency === 'yearly') {
    return addMonthsSafe(dateValue, 12)
  }
  return addDaysSafe(dateValue, 7)
}

