const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(message, isNetwork = false, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.isNetwork = isNetwork
    this.status = status
  }
}

/**
 * Universal JSON request wrapper
 */
export async function request(path, options = {}) {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new ApiError(body.detail || 'Não foi possível concluir a operação.', false, response.status)
    }
    return response.status === 204 ? null : response.json()
  } catch (err) {
    if (err instanceof ApiError) throw err

    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new ApiError('A API parece estar desconectada. Verifique se o servidor está ativo na porta 8000.', true)
    }
    throw err
  }
}

export const expensesApi = {
  list(month, status) {
    const query = new URLSearchParams()
    if (month) query.set('month', month)
    if (status) query.set('status', status)
    const qs = query.toString()
    return request(`/api/v1/expenses${qs ? `?${qs}` : ''}`)
  },
  create(data) {
    return request('/api/v1/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update(id, data) {
    return request(`/api/v1/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete(id) {
    return request(`/api/v1/expenses/${id}`, {
      method: 'DELETE',
    })
  },
  toggleStatus(id) {
    return request(`/api/v1/expenses/${id}/toggle-status`, {
      method: 'PATCH',
    })
  },
}

export const incomeApi = {
  list() {
    return request('/api/v1/income')
  },
  create(data) {
    return request('/api/v1/income', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update(id, data) {
    return request(`/api/v1/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete(id) {
    return request(`/api/v1/income/${id}`, {
      method: 'DELETE',
    })
  },
}

export const balanceApi = {
  get(month) {
    const qs = month ? `?month=${encodeURIComponent(month)}` : ''
    return request(`/api/v1/balance${qs}`)
  },
  update(initialBalance) {
    return request('/api/v1/balance', {
      method: 'PUT',
      body: JSON.stringify({ initialBalance }),
    })
  },
}

export const recurringApi = {
  process() {
    return request('/api/v1/recurring/process', {
      method: 'POST',
    })
  },
}

export const backupApi = {
  export() {
    return request('/api/v1/backup')
  },
  restore(data) {
    return request('/api/v1/backup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
