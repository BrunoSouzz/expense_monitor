import { send } from '../utils/http.js'
import { calculateSummary } from '../services/summary.service.js'
import { processRecurringTransactions } from '../services/recurring.service.js'

export const getSummary = (req, res, url) => {
  processRecurringTransactions()
  const month = url.searchParams.get('month') || null
  send(res, 200, calculateSummary(month))
}
