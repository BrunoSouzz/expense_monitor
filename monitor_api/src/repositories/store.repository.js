import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { config } from '../config/env.js'
import { sanitizeExpense } from '../validators/expense.validator.js'

mkdirSync(config.dataDirectory, { recursive: true })

const loadStore = () => {
  if (!existsSync(config.dataFile)) {
    return {
      initialBalance: 0,
      expenses: [],
      incomeSources: [],
    }
  }
  try {
    const raw = readFileSync(config.dataFile, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      initialBalance: typeof parsed.initialBalance === 'number' && Number.isFinite(parsed.initialBalance)
        ? Math.round(parsed.initialBalance * 100) / 100
        : 0,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses.map(sanitizeExpense) : [],
      incomeSources: Array.isArray(parsed.incomeSources) ? parsed.incomeSources : [],
    }
  } catch (error) {
    throw new Error(`Não foi possível ler o arquivo de dados: ${error.message}`)
  }
}

export const store = loadStore()

export const saveStore = () => {
  writeFileSync(config.dataFile, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
}

export const resetStore = (incomingData) => {
  store.initialBalance = typeof incomingData.initialBalance === 'number' ? incomingData.initialBalance : 0
  store.expenses = Array.isArray(incomingData.expenses) ? incomingData.expenses.map(sanitizeExpense) : []
  store.incomeSources = Array.isArray(incomingData.incomeSources) ? incomingData.incomeSources : []
  saveStore()
  return store
}
