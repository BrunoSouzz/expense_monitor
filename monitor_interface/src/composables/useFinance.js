import { ref, computed } from 'vue'
import { expensesApi, incomeApi, balanceApi, recurringApi, backupApi } from '../services/api'
import { CATEGORIES_LIST, CHART_COLORS } from '../constants/categories'
import { getCurrentMonthIso, formatMonthLabel } from '../utils/formatters'
import { exportExpensesToCsv } from '../utils/exportCsv'
import { getTodayIso } from '../models/types'

export function useFinance() {
  const currentMonthIso = getCurrentMonthIso()
  const todayIso = getTodayIso()

  // Core state
  const expenses = ref([])
  const incomeSources = ref([])
  const initialBalance = ref(0)
  const baseInitialBalance = ref(0)
  const rollover = ref(0)
  const loading = ref(true)
  const apiOnline = ref(true)
  const error = ref('')

  // Period / Month selection
  const selectedMonth = ref(localStorage.getItem('expense-selected-month') || currentMonthIso)
  const viewAllTime = ref(localStorage.getItem('expense-view-all') === 'true')

  // Custom categories list from localStorage
  const customCategories = ref(JSON.parse(localStorage.getItem('expense-custom-categories') || '[]'))

  function addCustomCategory(cat) {
    if (!cat || !cat.trim()) return
    const trimmed = cat.trim()
    if (!CATEGORIES_LIST.includes(trimmed) && !customCategories.value.includes(trimmed)) {
      customCategories.value.push(trimmed)
      localStorage.setItem('expense-custom-categories', JSON.stringify(customCategories.value))
    }
  }

  const allCategories = computed(() => {
    const set = new Set([...CATEGORIES_LIST, ...customCategories.value])
    expenses.value.forEach((e) => {
      if (e.category) set.add(e.category)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  })

  // Filters & Search
  const searchQuery = ref('')
  const selectedCategory = ref('Todas')
  const selectedStatus = ref('all') // 'all' | 'pending' | 'paid' | 'overdue'
  const sortOrder = ref('date_desc')

  // Charts
  const chartType = ref(localStorage.getItem('expense-chart-type') || 'bars')

  function setChartType(type) {
    chartType.value = type
    localStorage.setItem('expense-chart-type', type)
  }

  // Data loaders
  async function loadExpenses() {
    loading.value = true
    try {
      const monthParam = (!viewAllTime.value && selectedMonth.value) ? selectedMonth.value : undefined
      const data = await expensesApi.list(monthParam)
      apiOnline.value = true
      expenses.value = Array.isArray(data) ? data : []
      error.value = ''
    } catch (err) {
      if (err.isNetwork) {
        apiOnline.value = false
      }
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadIncomeSources() {
    try {
      const data = await incomeApi.list()
      apiOnline.value = true
      incomeSources.value = Array.isArray(data) ? data : []
    } catch (err) {
      if (err.isNetwork) {
        apiOnline.value = false
      }
      error.value = err.message
    }
  }

  async function loadInitialBalance() {
    try {
      const monthParam = (!viewAllTime.value && selectedMonth.value) ? selectedMonth.value : undefined
      const data = await balanceApi.get(monthParam)
      apiOnline.value = true
      if (data && typeof data.initialBalance === 'number') {
        initialBalance.value = data.initialBalance
        baseInitialBalance.value = data.baseInitialBalance ?? data.initialBalance
        rollover.value = data.rollover ?? 0
      }
    } catch (err) {
      if (err.isNetwork) {
        apiOnline.value = false
      }
      // Non-critical
    }
  }

  async function reloadAllData() {
    await Promise.all([loadExpenses(), loadIncomeSources(), loadInitialBalance()])
  }

  // Period navigation
  const monthDisplayLabel = computed(() => {
    return formatMonthLabel(selectedMonth.value, viewAllTime.value)
  })

  async function changeMonth(delta) {
    viewAllTime.value = false
    localStorage.setItem('expense-view-all', 'false')
    const [yearStr, monthStr] = selectedMonth.value.split('-')
    const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1)
    selectedMonth.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    localStorage.setItem('expense-selected-month', selectedMonth.value)
    await reloadAllData()
  }

  async function selectCurrentMonth() {
    viewAllTime.value = false
    localStorage.setItem('expense-view-all', 'false')
    selectedMonth.value = currentMonthIso
    localStorage.setItem('expense-selected-month', currentMonthIso)
    await reloadAllData()
  }

  async function toggleViewAllTime() {
    viewAllTime.value = !viewAllTime.value
    localStorage.setItem('expense-view-all', String(viewAllTime.value))
    await reloadAllData()
  }

  // Financial Calculations
  const totalExpenses = computed(() => expenses.value.reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const paidExpenses = computed(() => expenses.value.filter((i) => i.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const pendingExpenses = computed(() => expenses.value.filter((i) => i.status === 'pending').reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const totalIncome = computed(() => incomeSources.value.reduce((sum, source) => sum + Number(source.amount || 0), 0))

  // Overdue expenses
  const overdueExpenses = computed(() =>
    expenses.value.filter((e) => e.status === 'pending' && e.date && e.date < todayIso)
  )
  const overdueCount = computed(() => overdueExpenses.value.length)
  const overdueTotal = computed(() =>
    overdueExpenses.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  )

  // Total available money (Initial balance/rollover + extra income)
  const availableFunds = computed(() => Number(initialBalance.value) + Number(totalIncome.value))

  // Real current balance (money in hand right now = availableFunds - paidExpenses)
  const currentInHandBalance = computed(() => availableFunds.value - paidExpenses.value)

  // Projected final balance (what will be left after all planned expenses are paid - rolls over into next month!)
  const projectedFinalBalance = computed(() => availableFunds.value - totalExpenses.value)

  // Progress of paid vs total
  const paidPercentage = computed(() => {
    if (totalExpenses.value <= 0) return 0
    return Math.min(Math.round((paidExpenses.value / totalExpenses.value) * 100), 100)
  })

  // Categories Summary & Chart data
  const categorySummary = computed(() => {
    const totals = expenses.value.reduce((map, expense) => {
      map[expense.category] = (map[expense.category] || 0) + Number(expense.amount)
      return map
    }, {})
    return Object.entries(totals).sort(([, a], [, b]) => b - a)
  })

  const categoryChart = computed(() => categorySummary.value.slice(0, 6).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses.value ? Math.round((amount / totalExpenses.value) * 100) : 0,
  })))

  const pieSegments = computed(() => {
    let start = 0
    return categoryChart.value.map((item, index) => {
      const size = totalExpenses.value ? (item.amount / totalExpenses.value) * 100 : 0
      const end = start + size
      const segment = { ...item, index, start, end, midpoint: (start + end) * 1.8 }
      start = end
      return segment
    })
  })

  const pieGradient = computed(() => {
    if (!pieSegments.value.length) return 'var(--surface-soft) 0% 100%'
    return pieSegments.value.map((item) => (
      `${CHART_COLORS[item.index % CHART_COLORS.length]} ${item.start}% ${item.end}%, var(--surface) ${item.end}% ${Math.min(item.end + 0.7, 100)}%`
    )).join(', ')
  })

  // Filtered and sorted expenses list
  const filteredExpenses = computed(() => {
    let list = [...expenses.value]
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      list = list.filter((e) =>
        e.description.toLowerCase().includes(q) || (e.notes && e.notes.toLowerCase().includes(q)) || e.category.toLowerCase().includes(q)
      )
    }
    if (selectedCategory.value !== 'Todas') {
      list = list.filter((e) => e.category === selectedCategory.value)
    }
    if (selectedStatus.value === 'overdue') {
      list = list.filter((e) => e.status === 'pending' && e.date && e.date < todayIso)
    } else if (selectedStatus.value !== 'all') {
      list = list.filter((e) => e.status === selectedStatus.value)
    }

    if (sortOrder.value === 'date_desc') list.sort((a, b) => b.date.localeCompare(a.date))
    else if (sortOrder.value === 'date_asc') list.sort((a, b) => a.date.localeCompare(b.date))
    else if (sortOrder.value === 'amount_desc') list.sort((a, b) => b.amount - a.amount)
    else if (sortOrder.value === 'amount_asc') list.sort((a, b) => a.amount - b.amount)

    return list
  })

  function clearFilters() {
    searchQuery.value = ''
    selectedCategory.value = 'Todas'
    selectedStatus.value = 'all'
  }

  // Mutation actions
  async function saveExpense(expenseData, id = null) {
    if (expenseData.isCustomCategory && expenseData.customCategoryName) {
      expenseData.category = expenseData.customCategoryName.trim()
      addCustomCategory(expenseData.category)
    }
    if (id) {
      await expensesApi.update(id, expenseData)
    } else {
      await expensesApi.create(expenseData)
    }
    await reloadAllData()
  }

  async function toggleExpenseStatus(expense) {
    await expensesApi.toggleStatus(expense.id)
    expense.status = expense.status === 'paid' ? 'pending' : 'paid'
    await reloadAllData()
  }

  async function deleteExpense(id) {
    await expensesApi.delete(id)
    await reloadAllData()
  }

  async function saveIncome(incomeData, id = null) {
    if (id) {
      await incomeApi.update(id, incomeData)
    } else {
      await incomeApi.create(incomeData)
    }
    await reloadAllData()
  }

  async function deleteIncome(id) {
    await incomeApi.delete(id)
    await reloadAllData()
  }

  async function saveInitialBalance(amount) {
    await balanceApi.update(amount)
    await reloadAllData()
  }

  async function processRecurring() {
    const result = await recurringApi.process()
    await reloadAllData()
    return result
  }

  async function exportBackup() {
    const backup = await backupApi.export()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backup_expense_monitor_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function restoreBackup(file) {
    const text = await file.text()
    const parsed = JSON.parse(text)
    await backupApi.restore(parsed)
    await reloadAllData()
  }

  function exportCsv() {
    if (!expenses.value.length) return false
    const filename = `despesas_${viewAllTime.value ? 'todas' : selectedMonth.value}.csv`
    return exportExpensesToCsv(expenses.value, filename)
  }

  return {
    todayIso,
    currentMonthIso,
    expenses,
    incomeSources,
    initialBalance,
    baseInitialBalance,
    rollover,
    loading,
    apiOnline,
    error,
    selectedMonth,
    viewAllTime,
    monthDisplayLabel,
    searchQuery,
    selectedCategory,
    selectedStatus,
    sortOrder,
    chartType,
    allCategories,
    addCustomCategory,
    overdueExpenses,
    overdueCount,
    overdueTotal,
    totalExpenses,
    paidExpenses,
    pendingExpenses,
    totalIncome,
    availableFunds,
    currentInHandBalance,
    projectedFinalBalance,
    paidPercentage,
    categorySummary,
    categoryChart,
    pieSegments,
    pieGradient,
    filteredExpenses,
    loadExpenses,
    loadIncomeSources,
    loadInitialBalance,
    reloadAllData,
    changeMonth,
    selectCurrentMonth,
    toggleViewAllTime,
    setChartType,
    clearFilters,
    saveExpense,
    toggleExpenseStatus,
    deleteExpense,
    saveIncome,
    deleteIncome,
    saveInitialBalance,
    processRecurring,
    exportBackup,
    restoreBackup,
    exportCsv,
  }
}
