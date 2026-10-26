import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createExpenseServer, startServer } from './main.js'

export { createExpenseServer, startServer }

const isDirectRun = Boolean(
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()
)

if (isDirectRun) {
  startServer()
}

export default startServer
