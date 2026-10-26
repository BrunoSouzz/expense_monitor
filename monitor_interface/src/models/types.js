/**
 * @typedef {Object} Expense
 * @property {string|number} [id]
 * @property {string} description
 * @property {number|string} amount
 * @property {string} category
 * @property {string} paymentMethod
 * @property {'paid'|'pending'} status
 * @property {string} [notes]
 * @property {boolean} recurring
 * @property {'weekly'|'monthly'|'yearly'} [recurringFrequency]
 * @property {string} date - ISO date string (YYYY-MM-DD)
 */

/**
 * @typedef {Object} IncomeSource
 * @property {string|number} [id]
 * @property {string} name
 * @property {number|string} amount
 * @property {boolean} recurring
 * @property {'weekly'|'monthly'|'yearly'} [recurringFrequency]
 */

/**
 * @typedef {Object} ToastNotification
 * @property {boolean} show
 * @property {string} message
 * @property {'info'|'success'|'error'|'warning'} type
 */

/**
 * Returns today's date formatted as YYYY-MM-DD using local time
 * @returns {string}
 */
export function getTodayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Factory function for a new Expense model
 * @param {string} [defaultDate]
 * @returns {Expense}
 */
export function createDefaultExpense(defaultDate) {
  return {
    description: '',
    amount: '',
    category: 'Alimentação',
    paymentMethod: 'Pix',
    status: 'paid',
    notes: '',
    date: defaultDate || getTodayIso(),
    entryType: 'single', // 'single' | 'recurring' | 'installment'
    recurring: false,
    recurringFrequency: 'monthly',
    installments: 2,
    installmentType: 'total', // 'total' | 'installment_value'
    isCustomCategory: false,
    customCategoryName: '',
  }
}

/**
 * Factory function for a new Income model
 * @returns {IncomeSource}
 */
export function createDefaultIncome() {
  return {
    name: '',
    amount: '',
    recurring: false,
    recurringFrequency: 'monthly',
    date: getTodayIso(),
  }
}

/**
 * Validates an expense object before submission
 * @param {Expense} expense
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateExpense(expense) {
  if (!expense) return { valid: false, message: 'Dados da despesa inválidos.' }
  if (!expense.description || !expense.description.trim()) {
    return { valid: false, message: 'A descrição da despesa é obrigatória.' }
  }
  const amount = Number(expense.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, message: 'Informe um valor válido e maior que zero.' }
  }
  if (!expense.date) {
    return { valid: false, message: 'A data da despesa é obrigatória.' }
  }
  if (expense.isCustomCategory && (!expense.customCategoryName || !expense.customCategoryName.trim())) {
    return { valid: false, message: 'Por favor, escreva o nome da nova categoria.' }
  }
  if (expense.entryType === 'installment') {
    const n = Number(expense.installments)
    if (!Number.isInteger(n) || n < 2 || n > 72) {
      return { valid: false, message: 'O número de parcelas deve ser entre 2 e 72.' }
    }
  }
  return { valid: true }
}

/**
 * Validates an income source object before submission
 * @param {IncomeSource} income
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateIncome(income) {
  if (!income) return { valid: false, message: 'Dados da entrada inválidos.' }
  if (!income.name || !income.name.trim()) {
    return { valid: false, message: 'O nome da entrada é obrigatório.' }
  }
  const amount = Number(income.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, message: 'Informe um valor válido e maior que zero.' }
  }
  return { valid: true }
}

/**
 * Validates an initial balance value
 * @param {number|string} balance
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateBalance(balance) {
  const amount = Number(balance)
  if (!Number.isFinite(amount) || amount < 0) {
    return { valid: false, message: 'Informe um valor de saldo válido maior ou igual a zero.' }
  }
  return { valid: true }
}
