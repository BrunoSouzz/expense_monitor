import { send, readBody } from '../utils/http.js'
import { store, resetStore } from '../repositories/store.repository.js'
import { calculateSummary } from '../services/summary.service.js'

export const getApiInfo = (req, res) => {
  send(res, 200, {
    name: 'Expense Monitor API',
    version: '1.0.0',
    description: 'API leve para acompanhamento financeiro, simulação de saldo e controle de despesas sem necessidade de dinheiro real.',
    status: 'online',
    endpoints: {
      health: 'GET /health',
      summary: 'GET /api/v1/summary?month=YYYY-MM',
      balance: 'GET, PUT /api/v1/balance',
      expenses: 'GET, POST /api/v1/expenses, PUT, PATCH, DELETE /api/v1/expenses/:id',
      toggleExpenseStatus: 'PATCH /api/v1/expenses/:id/toggle-status',
      income: 'GET, POST /api/v1/income, PUT, DELETE /api/v1/income/:id',
      backup: 'GET, POST /api/v1/backup',
      recurring: 'POST /api/v1/recurring/process',
    },
  })
}

export const getHealth = (req, res) => {
  send(res, 200, {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
}

export const getBackup = (req, res) => {
  send(res, 200, {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: store,
  })
}

export const restoreBackup = async (req, res) => {
  const body = await readBody(req)
  const incomingData = body?.data || body
  if (!incomingData || (!Array.isArray(incomingData.expenses) && !Array.isArray(incomingData.incomeSources))) {
    return send(res, 400, { detail: 'Estrutura de backup inválida.' })
  }
  resetStore(incomingData)
  return send(res, 200, { message: 'Backup restaurado com sucesso.', summary: calculateSummary() })
}
