import { ref, watch } from 'vue'
import { api } from './useApi.js'
import { currentMonth } from '../lib/format.js'

/** Dados do mês selecionado (despesas, entradas e resumo) e as ações que os alteram. */
export function useFinance() {
  const month = ref(currentMonth())
  const expenses = ref([])
  const income = ref([])
  const summary = ref(null)
  const loading = ref(true)
  const loadError = ref('')
  let latestRequest = 0

  async function refresh() {
    const request = ++latestRequest
    loadError.value = ''
    try {
      const [nextExpenses, nextIncome, nextSummary] = await Promise.all([
        api(`/api/v1/expenses?month=${month.value}`),
        api('/api/v1/income'),
        api(`/api/v1/summary?month=${month.value}`),
      ])
      if (request !== latestRequest) return // o usuário já trocou de mês
      expenses.value = nextExpenses
      income.value = nextIncome
      summary.value = nextSummary
    } catch (error) {
      if (request === latestRequest) loadError.value = error.message
    } finally {
      if (request === latestRequest) loading.value = false
    }
  }

  const mutate = async (work) => {
    const result = await work()
    await refresh()
    return result
  }

  watch(month, () => {
    loading.value = true
    refresh()
  })

  return {
    month,
    expenses,
    income,
    summary,
    loading,
    loadError,
    refresh,
    saveExpense: (payload, id) => mutate(() => (id
      ? api(`/api/v1/expenses/${id}`, { method: 'PUT', body: payload })
      : api('/api/v1/expenses', { method: 'POST', body: payload }))),
    removeExpense: (id) => mutate(() => api(`/api/v1/expenses/${id}`, { method: 'DELETE' })),
    saveIncome: (payload, id) => mutate(() => (id
      ? api(`/api/v1/income/${id}`, { method: 'PUT', body: payload })
      : api('/api/v1/income', { method: 'POST', body: payload }))),
    removeIncome: (id) => mutate(() => api(`/api/v1/income/${id}`, { method: 'DELETE' })),
    processRecurring: () => mutate(() => api('/api/v1/recurring/process', { method: 'POST' })),
  }
}
