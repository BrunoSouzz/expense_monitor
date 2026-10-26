import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createExpenseServer } from './src/app.js'
import { config } from './src/config/env.js'
import { processRecurringTransactions } from './src/services/recurring.service.js'

export { createExpenseServer }

export const startServer = () => {
  const server = createExpenseServer()

  if (process.env.NODE_ENV !== 'test') {
    server.listen(config.port, () => {
      console.log(`Expense Monitor API rodando em http://localhost:${config.port}`)
    })
    const recurringTimer = setInterval(processRecurringTransactions, 60 * 1000)
    recurringTimer.unref()
  }

  return server
}

const isDirectRun = Boolean(
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()
)

if (isDirectRun) {
  startServer()
}

export default startServer
