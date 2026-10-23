/**
 * Factory functions and models for Expense and Income entities
 */

export function createDefaultExpense(defaultDate) {
  return {
    description: '',
    amount: '',
    category: 'Alimentação',
    paymentMethod: 'Cartão de débito',
    status: 'paid',
    notes: '',
    recurring: false,
    recurringFrequency: 'monthly',
    date: defaultDate || new Date().toISOString().slice(0, 10),
  }
}

export function createDefaultIncome() {
  return {
    name: '',
    amount: '',
    recurring: false,
    recurringFrequency: 'monthly',
  }
}
