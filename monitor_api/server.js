import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './src/app.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 8000)
const dataDir = process.env.EXPENSE_MONITOR_DATA_DIR || path.join(here, 'data')
// Se o front-end já foi compilado (npm run build em monitor_interface), a API também o serve.
const staticDir = process.env.EXPENSE_MONITOR_STATIC_DIR || path.join(here, '..', 'monitor_interface', 'dist')

const app = createApp({ dataDir, staticDir })
const actualPort = await app.listen(port)
console.log(`Expense Monitor API rodando em http://localhost:${actualPort}`)

const shutdown = async () => {
  await app.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
