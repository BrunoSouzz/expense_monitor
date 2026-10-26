import { send, readBody } from '../utils/http.js'
import { store, saveStore } from '../repositories/store.repository.js'
import { getMonthStartingBalance } from '../services/summary.service.js'

export const getBalance = (req, res, url) => {
  const month = url?.searchParams?.get('month')
  const baseBalance = store.initialBalance || 0
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const monthBalance = getMonthStartingBalance(month)
    return send(res, 200, {
      initialBalance: monthBalance,
      baseInitialBalance: baseBalance,
      rollover: Math.round((monthBalance - baseBalance) * 100) / 100,
    })
  }
  return send(res, 200, { initialBalance: baseBalance, baseInitialBalance: baseBalance })
}

export const updateBalance = async (req, res) => {
  const body = await readBody(req)
  const amount = Number(body?.initialBalance ?? body?.amount)
  if (!Number.isFinite(amount) || amount < 0) {
    return send(res, 400, { detail: 'Valor do saldo inicial inválido. Deve ser um número maior ou igual a zero.' })
  }
  store.initialBalance = Math.round(amount * 100) / 100
  saveStore()
  return send(res, 200, { initialBalance: store.initialBalance })
}
