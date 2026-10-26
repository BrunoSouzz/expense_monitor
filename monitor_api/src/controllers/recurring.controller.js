import { send } from '../utils/http.js'
import { processRecurringTransactions } from '../services/recurring.service.js'

export const processRecurring = (req, res) => {
  send(res, 200, { processed: processRecurringTransactions() })
}
