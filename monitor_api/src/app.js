import { createServer } from 'node:http'
import { handleRequest } from './routes/router.js'

export const createExpenseServer = () => {
  return createServer(handleRequest)
}
