<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Core state
const expenses = ref([])
const incomeSources = ref([])
const initialBalance = ref(0)
const loading = ref(true)
const apiOnline = ref(true)
const error = ref('')

// Toast notifications
const toast = ref({ show: false, message: '', type: 'info' })
let toastTimer = null
function showToast(message, type = 'info') {
  toast.value = { show: true, message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 3200)
}

// Period / Month selection
const now = new Date()
const currentMonthIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const selectedMonth = ref(localStorage.getItem('expense-selected-month') || currentMonthIso)
const viewAllTime = ref(localStorage.getItem('expense-view-all') === 'true')

// Filters & Search
const searchQuery = ref('')
const selectedCategory = ref('Todas')
const selectedStatus = ref('all') // 'all' | 'paid' | 'pending'
const sortOrder = ref('date_desc')

// Modals
const showForm = ref(false)
const showSettings = ref(false)
const showIncomeForm = ref(false)
const showBalanceModal = ref(false)
const itemToDelete = ref(null)
const editingExpense = ref(null)
const editingIncome = ref(null)

// Accessibility & Themes
const theme = ref(localStorage.getItem('expense-theme') || 'pastel')
const fontScale = ref(Number(localStorage.getItem('expense-font-scale') || 1))
const reducedMotion = ref(localStorage.getItem('expense-reduced-motion') === 'true')
const lineSpacing = ref(localStorage.getItem('expense-line-spacing') === 'true')
const largeCursor = ref(localStorage.getItem('expense-large-cursor') === 'true')
const focusHighlight = ref(localStorage.getItem('expense-focus-highlight') !== 'false')
const voiceEnabled = ref(localStorage.getItem('expense-voice-assistant') === 'true')
const isListening = ref(false)
const voiceStatus = ref('')
let speechRecognition = null
let guideTarget = null
let guideTimer = null

// Charts
const chartType = ref(localStorage.getItem('expense-chart-type') || 'bars')

// Forms
const form = ref({
  description: '',
  amount: '',
  category: 'Alimentação',
  paymentMethod: 'Cartão de débito',
  status: 'paid',
  notes: '',
  recurring: false,
  recurringFrequency: 'monthly',
  date: new Date().toISOString().slice(0, 10),
})

const incomeForm = ref({
  name: '',
  amount: '',
  recurring: false,
  recurringFrequency: 'monthly',
})

const balanceInput = ref(0)

document.documentElement.style.setProperty('--font-scale', String(fontScale.value))

// API helper
async function request(path, options = {}) {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    apiOnline.value = true
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.detail || 'Não foi possível concluir a operação.')
    }
    return response.status === 204 ? null : response.json()
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      apiOnline.value = false
      throw new Error('A API parece estar desconectada. Verifique se o servidor está ativo na porta 8000.')
    }
    throw err
  }
}

// Data loaders
async function loadExpenses() {
  loading.value = true
  try {
    const query = new URLSearchParams()
    if (!viewAllTime.value && selectedMonth.value) {
      query.set('month', selectedMonth.value)
    }
    const data = await request(`/api/v1/expenses?${query.toString()}`)
    expenses.value = Array.isArray(data) ? data : []
    error.value = ''
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadIncomeSources() {
  try {
    const data = await request('/api/v1/income')
    incomeSources.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err.message
  }
}

async function loadInitialBalance() {
  try {
    const data = await request('/api/v1/balance')
    if (data && typeof data.initialBalance === 'number') {
      initialBalance.value = data.initialBalance
      balanceInput.value = data.initialBalance
    }
  } catch (err) {
    // Non-critical
  }
}

async function reloadAllData() {
  await Promise.all([loadExpenses(), loadIncomeSources(), loadInitialBalance()])
}

// Period navigation
const monthDisplayLabel = computed(() => {
  if (viewAllTime.value) return 'Todo o período'
  if (!selectedMonth.value) return 'Mês selecionado'
  const [yearStr, monthStr] = selectedMonth.value.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return monthName.charAt(0).toUpperCase() + monthName.slice(1)
})

function changeMonth(delta) {
  viewAllTime.value = false
  localStorage.setItem('expense-view-all', 'false')
  const [yearStr, monthStr] = selectedMonth.value.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1)
  selectedMonth.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  localStorage.setItem('expense-selected-month', selectedMonth.value)
  loadExpenses()
}

function selectCurrentMonth() {
  viewAllTime.value = false
  localStorage.setItem('expense-view-all', 'false')
  selectedMonth.value = currentMonthIso
  localStorage.setItem('expense-selected-month', currentMonthIso)
  loadExpenses()
}

function toggleViewAllTime() {
  viewAllTime.value = !viewAllTime.value
  localStorage.setItem('expense-view-all', String(viewAllTime.value))
  loadExpenses()
}

// Financial Calculations
const totalExpenses = computed(() => expenses.value.reduce((sum, item) => sum + Number(item.amount || 0), 0))
const paidExpenses = computed(() => expenses.value.filter((i) => i.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0))
const pendingExpenses = computed(() => expenses.value.filter((i) => i.status === 'pending').reduce((sum, item) => sum + Number(item.amount || 0), 0))
const totalIncome = computed(() => incomeSources.value.reduce((sum, source) => sum + Number(source.amount || 0), 0))

// Total available money (Initial balance + extra income)
const availableFunds = computed(() => Number(initialBalance.value) + Number(totalIncome.value))

// Real current balance (money in hand right now = availableFunds - paidExpenses)
const currentInHandBalance = computed(() => availableFunds.value - paidExpenses.value)

// Projected final balance (what will be left after all planned expenses are paid)
const projectedFinalBalance = computed(() => availableFunds.value - totalExpenses.value)

// Progress of paid vs total
const paidPercentage = computed(() => {
  if (totalExpenses.value <= 0) return 0
  return Math.min(Math.round((paidExpenses.value / totalExpenses.value) * 100), 100)
})

// Categories
const categoriesList = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Contas', 'Outros']

const categorySummary = computed(() => {
  const totals = expenses.value.reduce((map, expense) => {
    map[expense.category] = (map[expense.category] || 0) + Number(expense.amount)
    return map
  }, {})
  return Object.entries(totals).sort(([, a], [, b]) => b - a)
})

const categoryChart = computed(() => categorySummary.value.slice(0, 4).map(([category, amount]) => ({
  category,
  amount,
  percentage: totalExpenses.value ? Math.round((amount / totalExpenses.value) * 100) : 0,
})))

const chartColors = ['var(--accent)', 'var(--support)', 'var(--success)', 'var(--accent-dark)']
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
    `${chartColors[item.index]} ${item.start}% ${item.end}%, var(--surface) ${item.end}% ${Math.min(item.end + 0.7, 100)}%`
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
  if (selectedStatus.value !== 'all') {
    list = list.filter((e) => e.status === selectedStatus.value)
  }

  if (sortOrder.value === 'date_desc') list.sort((a, b) => b.date.localeCompare(a.date))
  else if (sortOrder.value === 'date_asc') list.sort((a, b) => a.date.localeCompare(b.date))
  else if (sortOrder.value === 'amount_desc') list.sort((a, b) => b.amount - a.amount)
  else if (sortOrder.value === 'amount_asc') list.sort((a, b) => a.amount - b.amount)

  return list
})

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function setChartType(type) {
  chartType.value = type
  localStorage.setItem('expense-chart-type', type)
}

// Modal open helpers
function openCreate() {
  editingExpense.value = null
  const defaultDate = viewAllTime.value ? new Date().toISOString().slice(0, 10) : `${selectedMonth.value}-01`
  form.value = {
    description: '',
    amount: '',
    category: 'Alimentação',
    paymentMethod: 'Cartão de débito',
    status: 'paid',
    notes: '',
    recurring: false,
    recurringFrequency: 'monthly',
    date: defaultDate,
  }
  showForm.value = true
}

function openEdit(expense) {
  editingExpense.value = expense
  form.value = { ...expense, amount: Number(expense.amount) }
  showForm.value = true
}

async function saveExpense() {
  try {
    const path = editingExpense.value ? `/api/v1/expenses/${editingExpense.value.id}` : '/api/v1/expenses'
    const method = editingExpense.value ? 'PUT' : 'POST'
    await request(path, { method, body: JSON.stringify(form.value) })
    showForm.value = false
    showToast(editingExpense.value ? 'Despesa atualizada com sucesso!' : 'Despesa registrada com sucesso!', 'success')
    await loadExpenses()
  } catch (err) {
    error.value = err.message
    showToast(err.message, 'error')
  }
}

async function toggleExpenseStatus(expense) {
  try {
    await request(`/api/v1/expenses/${expense.id}/toggle-status`, { method: 'PATCH' })
    expense.status = expense.status === 'paid' ? 'pending' : 'paid'
    showToast(expense.status === 'paid' ? 'Despesa marcada como Paga.' : 'Despesa marcada como A Pagar.', 'info')
  } catch (err) {
    showToast('Não foi possível alterar o status da despesa.', 'error')
  }
}

async function processRecurringExpenses() {
  try {
    const result = await request('/api/v1/recurring/process', { method: 'POST' })
    await reloadAllData()
    const expCount = result?.processed?.expenses || 0
    const incCount = result?.processed?.income || 0
    showToast(`Recorrências processadas: ${expCount} despesas e ${incCount} entradas geradas.`, 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function askDelete(item, type) {
  itemToDelete.value = { ...item, type }
}

async function confirmDelete() {
  if (!itemToDelete.value) return
  const item = itemToDelete.value
  try {
    const path = item.type === 'expense' ? `/api/v1/expenses/${item.id}` : `/api/v1/income/${item.id}`
    await request(path, { method: 'DELETE' })
    itemToDelete.value = null
    showToast('Item removido com sucesso.', 'info')
    if (item.type === 'expense') await loadExpenses()
    else await loadIncomeSources()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// Initial Balance Modal
function openBalanceModal() {
  balanceInput.value = initialBalance.value
  showBalanceModal.value = true
}

async function saveInitialBalance() {
  const amount = Number(balanceInput.value)
  if (!Number.isFinite(amount) || amount < 0) {
    showToast('Informe um valor de saldo válido maior ou igual a zero.', 'error')
    return
  }
  try {
    await request('/api/v1/balance', {
      method: 'PUT',
      body: JSON.stringify({ initialBalance: amount }),
    })
    initialBalance.value = amount
    showBalanceModal.value = false
    showToast('Saldo em conta atualizado!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// Income Form
function openIncomeForm(existing = null) {
  if (existing) {
    editingIncome.value = existing
    incomeForm.value = { ...existing, amount: Number(existing.amount) }
  } else {
    editingIncome.value = null
    incomeForm.value = { name: '', amount: '', recurring: false, recurringFrequency: 'monthly' }
  }
  showIncomeForm.value = true
}

async function saveIncome() {
  const amount = Number(incomeForm.value.amount)
  const name = incomeForm.value.name.trim()
  if (!name || !Number.isFinite(amount) || amount <= 0) return
  try {
    if (editingIncome.value) {
      await request(`/api/v1/income/${editingIncome.value.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...incomeForm.value, name, amount }),
      })
      showToast('Entrada atualizada com sucesso!', 'success')
    } else {
      await request('/api/v1/income', {
        method: 'POST',
        body: JSON.stringify({ ...incomeForm.value, name, amount }),
      })
      showToast('Entrada adicionada ao seu saldo!', 'success')
    }
    showIncomeForm.value = false
    await loadIncomeSources()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// CSV Export
function exportToCsv() {
  if (!expenses.value.length) {
    showToast('Não há despesas cadastradas para exportar.', 'info')
    return
  }
  const headers = ['Descrição', 'Valor (R$)', 'Categoria', 'Forma de Pagamento', 'Data', 'Status', 'Recorrente', 'Notas']
  const rows = expenses.value.map((e) => [
    `"${(e.description || '').replace(/"/g, '""')}"`,
    Number(e.amount).toFixed(2),
    `"${(e.category || '').replace(/"/g, '""')}"`,
    `"${(e.paymentMethod || '').replace(/"/g, '""')}"`,
    e.date,
    e.status === 'paid' ? 'Pago' : 'Pendente',
    e.recurring ? 'Sim' : 'Não',
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ])

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `despesas_${viewAllTime.value ? 'todas' : selectedMonth.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  showToast('Planilha CSV exportada com sucesso!', 'success')
}

// Full Backup Download / Restore
async function exportBackup() {
  try {
    const backup = await request('/api/v1/backup')
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backup_expense_monitor_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Backup exportado com sucesso!', 'success')
  } catch (err) {
    showToast('Erro ao exportar backup: ' + err.message, 'error')
  }
}

async function triggerRestoreBackup(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    await request('/api/v1/backup', {
      method: 'POST',
      body: JSON.stringify(parsed),
    })
    showToast('Backup restaurado com sucesso!', 'success')
    await reloadAllData()
  } catch (err) {
    showToast('Falha ao restaurar backup: ' + err.message, 'error')
  } finally {
    event.target.value = ''
  }
}

// Accessibility & Theme controls
function applyTheme(nextTheme) {
  theme.value = nextTheme
  localStorage.setItem('expense-theme', nextTheme)
}

function applyFontScale(value) {
  fontScale.value = Number(value)
  document.documentElement.style.setProperty('--font-scale', String(fontScale.value))
  localStorage.setItem('expense-font-scale', String(value))
}

function toggleMotion() {
  reducedMotion.value = !reducedMotion.value
  localStorage.setItem('expense-reduced-motion', String(reducedMotion.value))
}

function toggleAccessibilityOption(name, value) {
  const options = { lineSpacing, largeCursor, focusHighlight }
  options[name].value = value
  const storageKey = {
    lineSpacing: 'expense-line-spacing',
    largeCursor: 'expense-large-cursor',
    focusHighlight: 'expense-focus-highlight',
  }[name]
  localStorage.setItem(storageKey, String(value))
}

// Voice Assistant
function speak(text) {
  if (!voiceEnabled.value || !('speechSynthesis' in window)) {
    voiceStatus.value = 'A leitura por voz está desativada ou não é suportada neste navegador.'
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-BR'
  utterance.rate = 0.95
  utterance.onstart = () => { voiceStatus.value = 'Lendo informações em voz alta.' }
  utterance.onend = () => { voiceStatus.value = 'Leitura concluída.' }
  window.speechSynthesis.speak(utterance)
}

function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  voiceStatus.value = 'Leitura interrompida.'
}

function speakSummary() {
  const diff = projectedFinalBalance.value
  const diffMsg = diff >= 0
    ? `Projeção positiva. Sobrará ${formatCurrency(diff)} no final do período.`
    : `Atenção. As despesas superam o saldo em ${formatCurrency(Math.abs(diff))}.`
  speak(`Resumo financeiro de ${monthDisplayLabel.value}. Saldo disponível: ${formatCurrency(availableFunds.value)}. Total de despesas: ${formatCurrency(totalExpenses.value)}, sendo ${formatCurrency(paidExpenses.value)} já pagas e ${formatCurrency(pendingExpenses.value)} a pagar. ${diffMsg}`)
}

function handleVoiceCommand(command) {
  const normalized = command.toLowerCase()
  if (normalized.includes('parar') || normalized.includes('silêncio')) return stopSpeaking()
  if (normalized.includes('resumo') || normalized.includes('saldo')) return speakSummary()
  if (normalized.includes('nova despesa') || normalized.includes('adicionar despesa')) {
    openCreate()
    return speak('Formulário de nova despesa aberto.')
  }
  if (normalized.includes('preferência') || normalized.includes('acessibilidade')) {
    showSettings.value = true
    return speak('Preferências de acessibilidade abertas.')
  }
  speak('Comando não reconhecido. Tente dizer resumo financeiro, nova despesa ou preferências.')
}

function toggleVoiceAssistant() {
  voiceEnabled.value = !voiceEnabled.value
  localStorage.setItem('expense-voice-assistant', String(voiceEnabled.value))
  if (!voiceEnabled.value) {
    stopListening()
    stopSpeaking()
    return
  }
  speak('Assistente de voz ativado. Você pode pedir o resumo financeiro ou dizer nova despesa.')
}

function startListening() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Recognition) {
    voiceStatus.value = 'Comandos por voz não são suportados neste navegador. Use o Chrome ou Edge.'
    return
  }
  if (isListening.value) return
  speechRecognition = new Recognition()
  speechRecognition.lang = 'pt-BR'
  speechRecognition.continuous = false
  speechRecognition.interimResults = false
  speechRecognition.onstart = () => { isListening.value = true; voiceStatus.value = 'Ouvindo um comando...' }
  speechRecognition.onresult = (event) => handleVoiceCommand(event.results[0][0].transcript)
  speechRecognition.onerror = () => { voiceStatus.value = 'Não foi possível entender o comando. Tente novamente.' }
  speechRecognition.onend = () => { isListening.value = false }
  speechRecognition.start()
}

function stopListening() {
  if (speechRecognition) speechRecognition.stop()
  isListening.value = false
}

function getFieldLabel(field) {
  const label = field.closest('label')
  if (!label) return ''
  const labelText = Array.from(label.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent.trim())
    .join(' ')
  return labelText || label.textContent.trim().replace(/\s+/g, ' ')
}

function describeGuideTarget(target) {
  const tagName = target.tagName.toLowerCase()
  if (['input', 'select', 'textarea'].includes(tagName)) {
    const label = getFieldLabel(target) || target.getAttribute('aria-label') || 'Campo'
    const type = target.type === 'number'
      ? 'numérico'
      : target.type === 'date'
        ? 'de data'
        : tagName === 'select'
          ? 'de seleção'
          : 'de texto'
    const value = target.value ? ` Valor atual: ${target.value}.` : target.placeholder ? ` Exemplo: ${target.placeholder}.` : ''
    const options = tagName === 'select'
      ? ` Opções disponíveis: ${Array.from(target.options).map((option) => option.text).join(', ')}.`
      : ''
    return `${label}. Campo ${type}.${value}${options}`
  }
  return target.dataset.guide
    || target.getAttribute('aria-label')
    || target.dataset.tooltip
    || target.textContent.trim().replace(/\s+/g, ' ').slice(0, 120)
}

function handleGuideInteraction(event) {
  if (!voiceEnabled.value) return
  const target = event.target.closest('[data-guide], button, input, select, textarea, a, article, section')
  if (!target || !event.currentTarget.contains(target)) return
  const message = describeGuideTarget(target)
  if (!message || target === guideTarget) return
  guideTarget = target
  clearTimeout(guideTimer)
  guideTimer = setTimeout(() => speak(message), 650)
}

function hideGuide() {
  guideTarget = null
  clearTimeout(guideTimer)
}

onMounted(async () => {
  await reloadAllData()
})

onUnmounted(() => {
  stopListening()
  stopSpeaking()
  clearTimeout(guideTimer)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div
    class="app-shell font-sans"
    :class="[`theme-${theme}`, { 'reduce-motion': reducedMotion, 'wide-spacing': lineSpacing, 'large-cursor': largeCursor, 'focus-highlight': focusHighlight }]"
    :style="{ '--font-scale': fontScale }"
    @mouseover="handleGuideInteraction"
    @focusin="handleGuideInteraction"
    @mouseleave="hideGuide"
  >
    <!-- Toast Notification -->
    <transition name="toast-fade">
      <div v-if="toast.show" class="app-toast" :class="`toast-${toast.type}`" role="status" aria-live="polite">
        <span class="toast-indicator"></span>
        <span>{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Header -->
    <header class="site-header">
      <div class="header-content">
        <div class="brand-area">
          <a href="#" class="brand" aria-label="Expense Monitor - Início" data-guide="Logo do Expense Monitor. Sistema de simulação financeira.">
            <img src="/expense-mark.svg" alt="Expense Monitor" class="brand-mark" width="40" height="40">
            <div>
              <span class="brand-title">Expense <strong>Monitor</strong></span>
              <span class="brand-tagline">Simulador & Controle de Saldo</span>
            </div>
          </a>
          <span class="api-status-badge" :class="{ online: apiOnline, offline: !apiOnline }" :title="apiOnline ? 'API conectada' : 'API desconectada'">
            <span class="status-dot"></span>
            <span class="hide-mobile">{{ apiOnline ? 'Online' : 'Offline' }}</span>
          </span>
        </div>

        <div class="header-actions">
          <button class="icon-button hint" data-tooltip="Temas, contraste, leitura e acessibilidade." aria-label="Abrir preferências de acessibilidade" @click="showSettings = !showSettings">
            ⚙ <span class="hide-mobile">Acessibilidade</span>
          </button>
          <button class="secondary-button small hint" data-tooltip="Processa lançamentos recorrentes já vencidos." @click="processRecurringExpenses">
            ↻ Recorrentes
          </button>
          <button class="primary-button small hint" data-tooltip="Registrar um novo gasto para o período." @click="openCreate">
            + Nova Despesa
          </button>
        </div>
      </div>

      <!-- Settings Dropdown -->
      <div v-if="showSettings" class="settings-panel" aria-label="Preferências de acessibilidade">
        <div class="settings-header">
          <h3 class="setting-title">Preferências Visuais & Acessibilidade</h3>
          <button class="close-small-btn" @click="showSettings = false">×</button>
        </div>

        <div>
          <p class="setting-subtitle">Tema de Cores</p>
          <div class="theme-options" role="group" aria-label="Tema">
            <button :class="{ selected: theme === 'pastel' }" @click="applyTheme('pastel')">Pastel Cozy</button>
            <button :class="{ selected: theme === 'twilight' }" @click="applyTheme('twilight')">Crepúsculo</button>
            <button :class="{ selected: theme === 'contrast' }" @click="applyTheme('contrast')">Alto Contraste</button>
          </div>
        </div>

        <label class="setting-row">
          <span>Tamanho do texto</span>
          <input type="range" min="0.9" max="1.25" step="0.05" :value="fontScale" aria-label="Tamanho do texto" @input="applyFontScale($event.target.value)">
        </label>

        <label class="setting-row setting-toggle">
          <span>Espaçamento ampliado entre linhas</span>
          <input type="checkbox" :checked="lineSpacing" aria-label="Ativar espaçamento entre linhas" @change="toggleAccessibilityOption('lineSpacing', $event.target.checked)">
        </label>

        <label class="setting-row setting-toggle">
          <span>Cursor ampliado</span>
          <input type="checkbox" :checked="largeCursor" aria-label="Ativar cursor ampliado" @change="toggleAccessibilityOption('largeCursor', $event.target.checked)">
        </label>

        <label class="setting-row setting-toggle">
          <span>Destaque de foco no teclado</span>
          <input type="checkbox" :checked="focusHighlight" aria-label="Ativar destaque de foco" @change="toggleAccessibilityOption('focusHighlight', $event.target.checked)">
        </label>

        <label class="setting-row setting-toggle">
          <span>Reduzir animações de transição</span>
          <input type="checkbox" :checked="reducedMotion" aria-label="Reduzir animações" @change="toggleMotion">
        </label>

        <div class="voice-settings">
          <p class="setting-subtitle">Assistente de Voz & Leitura</p>
          <label class="setting-row setting-toggle">
            <span>Ativar leitor guiado por voz</span>
            <input type="checkbox" :checked="voiceEnabled" aria-label="Ativar assistente de voz" @change="toggleVoiceAssistant">
          </label>
          <div v-if="voiceEnabled" class="voice-actions">
            <button class="text-button" @click="speakSummary">Ouvir Resumo</button>
            <button class="text-button" @click="isListening ? stopListening() : startListening()">
              {{ isListening ? 'Parar Escuta' : 'Comando por Voz' }}
            </button>
            <button class="text-button" @click="stopSpeaking">Silenciar</button>
          </div>
          <p v-if="voiceStatus" class="form-help" aria-live="polite">{{ voiceStatus }}</p>
        </div>

        <div class="backup-actions">
          <p class="setting-subtitle">Dados & Backup</p>
          <div class="backup-buttons">
            <button class="secondary-button extra-small" @click="exportBackup">Baixar Backup (JSON)</button>
            <label class="secondary-button extra-small file-upload-btn">
              Restaurar Backup
              <input type="file" accept=".json" class="hidden-input" @change="triggerRestoreBackup">
            </label>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Period Selector Banner -->
      <section class="period-navigator-bar" aria-label="Controle de período">
        <div class="period-controls">
          <button class="period-nav-btn" aria-label="Mês anterior" @click="changeMonth(-1)">◀</button>
          <div class="period-title-box">
            <span class="period-label">Período de Análise</span>
            <strong class="period-current">{{ monthDisplayLabel }}</strong>
          </div>
          <button class="period-nav-btn" aria-label="Próximo mês" @click="changeMonth(1)">▶</button>
        </div>

        <div class="period-quick-actions">
          <button class="pill-btn" :class="{ active: !viewAllTime && selectedMonth === currentMonthIso }" @click="selectCurrentMonth">
            Mês Atual
          </button>
          <button class="pill-btn" :class="{ active: viewAllTime }" @click="toggleViewAllTime">
            {{ viewAllTime ? 'Visão Mensal' : 'Ver Todos os Meses' }}
          </button>
          <button class="pill-btn secondary" title="Exportar tabela de despesas para Excel / Planilhas" @click="exportToCsv">
            📥 Exportar CSV
          </button>
        </div>
      </section>

      <!-- Welcome Hero -->
      <section class="intro">
        <p class="eyebrow">Monitoramento Financeiro Descomplicado</p>
        <h1>Acompanhe seu saldo e saiba quanto vai sobrar.</h1>
        <p class="intro-copy">
          Defina seu dinheiro disponível no início do mês, simule os gastos previstos e acompanhe a diferença em tempo real conforme as despesas forem pagas.
        </p>
      </section>

      <!-- Financial Metrics Grid -->
      <section class="summary-grid" aria-label="Resumo do período">
        <!-- Card 1: Saldo Disponível (Em Conta) -->
        <article class="summary-card" data-guide="Saldo disponível. Mostra seu saldo inicial mais outras entradas financeiras.">
          <div class="card-top-row">
            <div class="card-icon soft" aria-hidden="true">
              <svg class="card-icon-svg" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
                <circle cx="16.5" cy="12" r="1.5" fill="currentColor"/>
                <path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/>
              </svg>
            </div>
            <div class="card-actions-quick">
              <button class="pill-action-btn" @click="openBalanceModal">Ajustar Saldo</button>
              <button class="pill-action-btn" @click="openIncomeForm()">+ Entrada</button>
            </div>
          </div>

          <p class="card-label">Dinheiro Disponível no Período</p>
          <strong class="metric-number">{{ formatCurrency(availableFunds) }}</strong>
          <span class="metric-sub">
            Saldo em conta: {{ formatCurrency(initialBalance) }}
            <span v-if="incomeSources.length"> · +{{ formatCurrency(totalIncome) }} em outras entradas</span>
          </span>

          <div v-if="incomeSources.length" class="income-list">
            <div v-for="source in incomeSources" :key="source.id" class="income-item">
              <span class="income-name">{{ source.name }}</span>
              <span class="income-val">
                {{ formatCurrency(source.amount) }}
                <button class="edit-link-btn" title="Editar entrada" @click="openIncomeForm(source)">✎</button>
                <button class="remove-income" :aria-label="`Remover ${source.name}`" title="Remover entrada" @click="askDelete(source, 'income')">×</button>
              </span>
            </div>
          </div>
        </article>

        <!-- Card 2: Despesas do Período -->
        <article class="summary-card" data-guide="Despesas do período. Total gasto ou planejado para o mês.">
          <div class="card-top-row">
            <div class="card-icon expense-icon" aria-hidden="true">
              <svg class="card-icon-svg" viewBox="0 0 24 24" fill="none">
                <path d="M5 19 19 5M10 5h9v9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="card-badge">{{ expenses.length }} lançamentos</span>
          </div>

          <p class="card-label">Total de Despesas no Período</p>
          <strong class="metric-number">{{ formatCurrency(totalExpenses) }}</strong>

          <!-- Paid vs Pending Breakdown -->
          <div class="expense-breakdown">
            <div class="breakdown-bar-track" :title="`${paidPercentage}% das despesas já foram pagas`">
              <div class="breakdown-bar-fill" :style="{ width: `${paidPercentage}%` }"></div>
            </div>
            <div class="breakdown-legend">
              <span class="legend-paid">✓ Pagas: <strong>{{ formatCurrency(paidExpenses) }}</strong></span>
              <span class="legend-pending">⏳ A Pagar: <strong>{{ formatCurrency(pendingExpenses) }}</strong></span>
            </div>
          </div>
        </article>

        <!-- Card 3: Projeção & Diferença ("Quanto vou ficar") -->
        <article class="summary-card featured" :class="{ warning: projectedFinalBalance < 0 }" data-guide="Projeção final do saldo após quitar todos os gastos previstos.">
          <div class="card-top-row">
            <div class="card-icon featured-icon" aria-hidden="true">
              <svg class="card-icon-svg" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="card-badge featured-badge">
              {{ projectedFinalBalance >= 0 ? 'Sobrará na conta' : 'Déficit Previsto' }}
            </span>
          </div>

          <p class="card-label">Saldo Final Estimado</p>
          <strong class="metric-number featured-number">{{ formatCurrency(projectedFinalBalance) }}</strong>

          <div class="projected-status-card">
            <div v-if="projectedFinalBalance >= 0" class="status-positive">
              <span>🎉 Economia estimada de <strong>{{ formatCurrency(projectedFinalBalance) }}</strong> ao fim do mês.</span>
              <small>Saldo restante em mãos agora: {{ formatCurrency(currentInHandBalance) }}</small>
            </div>
            <div v-else class="status-negative">
              <span>⚠️ Gastos superam o saldo em <strong>{{ formatCurrency(Math.abs(projectedFinalBalance)) }}</strong>.</span>
              <small>Ajuste despesas ou planeje novas entradas.</small>
            </div>
          </div>
        </article>
      </section>

      <!-- Category Charts Card -->
      <section class="summary-card chart-full-card" data-guide="Distribuição de gastos por categoria.">
        <div class="chart-header-row">
          <div>
            <h3>Distribuição por Categoria</h3>
            <p class="section-sub">Veja onde está a maior parte das suas saídas financeiras.</p>
          </div>
          <div class="chart-options" role="group" aria-label="Visualização do gráfico">
            <button :class="{ selected: chartType === 'bars' }" @click="setChartType('bars')">Barras</button>
            <button :class="{ selected: chartType === 'columns' }" @click="setChartType('columns')">Colunas</button>
            <button :class="{ selected: chartType === 'pie' }" @click="setChartType('pie')">Pizza</button>
          </div>
        </div>

        <div v-if="categoryChart.length && chartType === 'bars'" class="category-chart-bars">
          <div v-for="(item, index) in categoryChart" :key="item.category" class="chart-bar-row">
            <div class="chart-label">
              <span>{{ item.category }}</span>
              <div class="chart-val-box">
                <span class="chart-money-val">{{ formatCurrency(item.amount) }}</span>
                <strong>{{ item.percentage }}%</strong>
              </div>
            </div>
            <div class="chart-horizontal-track">
              <div class="chart-horizontal-bar" :class="`chart-color-${index}`" :style="{ width: `${Math.max(item.percentage, 2)}%` }"></div>
            </div>
          </div>
        </div>

        <div v-else-if="categoryChart.length && chartType === 'columns'" class="category-chart-columns">
          <div v-for="(item, index) in categoryChart" :key="item.category" class="chart-column-item">
            <div class="column-value">{{ item.percentage }}%</div>
            <div class="column-track">
              <div class="column-bar" :class="`chart-color-${index}`" :style="{ height: `${Math.max(item.percentage, 8)}%` }"></div>
            </div>
            <span class="column-category">{{ item.category }}</span>
            <small class="column-amount">{{ formatCurrency(item.amount) }}</small>
          </div>
        </div>

        <div v-else-if="categoryChart.length" class="category-chart-pie">
          <div class="pie-visual" :style="{ background: `conic-gradient(from -90deg, ${pieGradient})` }">
            <span v-for="item in pieSegments" :key="item.category" class="pie-label" :style="{ transform: `rotate(${item.midpoint}deg) translateY(-40px) rotate(-${item.midpoint}deg)` }">
              {{ item.percentage }}%
            </span>
          </div>
          <div class="pie-legend">
            <div v-for="item in pieSegments" :key="item.category" class="legend-item">
              <i class="legend-color" :class="`legend-color-${item.index}`"></i>
              <span class="legend-cat-name">{{ item.category }}</span>
              <span class="legend-cat-money">{{ formatCurrency(item.amount) }}</span>
              <strong>{{ item.percentage }}%</strong>
            </div>
          </div>
        </div>

        <div v-else class="empty-state-compact">
          Nenhuma despesa registrada neste período para exibir gráficos.
        </div>
      </section>

      <!-- Expenses List Section with Search & Filters -->
      <section class="expenses-card" data-guide="Lista detalhada de despesas com opções de busca e filtro.">
        <div class="expenses-header">
          <div>
            <h2>Despesas de {{ monthDisplayLabel }}</h2>
            <p>Monitore suas contas e marque como pagas conforme forem quitadas.</p>
          </div>
          <button class="primary-button small" @click="openCreate">+ Nova Despesa</button>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="filter-toolbar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input v-model="searchQuery" type="text" placeholder="Filtrar por nome ou notas..." class="search-input" aria-label="Pesquisar despesas">
            <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">×</button>
          </div>

          <div class="filter-controls">
            <select v-model="selectedCategory" class="filter-select" aria-label="Filtrar por categoria">
              <option value="Todas">Todas as categorias</option>
              <option v-for="cat in categoriesList" :key="cat" :value="cat">{{ cat }}</option>
            </select>

            <select v-model="selectedStatus" class="filter-select" aria-label="Filtrar por status">
              <option value="all">Todos os status</option>
              <option value="paid">Apenas Pagas</option>
              <option value="pending">Apenas A Pagar</option>
            </select>

            <select v-model="sortOrder" class="filter-select" aria-label="Ordenar despesas">
              <option value="date_desc">Mais recentes primeiro</option>
              <option value="date_asc">Mais antigas primeiro</option>
              <option value="amount_desc">Maior valor primeiro</option>
              <option value="amount_asc">Menor valor primeiro</option>
            </select>
          </div>
        </div>

        <!-- Expense Rows -->
        <div v-if="loading" class="empty-state">
          <div class="spinner"></div>
          <p>Carregando despesas...</p>
        </div>

        <div v-else-if="error" class="empty-state error-message">
          <p>{{ error }}</p>
          <button class="text-button" @click="reloadAllData">Tentar novamente</button>
        </div>

        <div v-else-if="!expenses.length" class="empty-state">
          <p>Nenhuma despesa encontrada para {{ monthDisplayLabel }}.</p>
          <button class="secondary-button small" style="margin-top: 12px;" @click="openCreate">Adicionar primeira despesa</button>
        </div>

        <div v-else-if="!filteredExpenses.length" class="empty-state">
          <p>Nenhuma despesa corresponde aos filtros aplicados.</p>
          <button class="text-button" @click="searchQuery = ''; selectedCategory = 'Todas'; selectedStatus = 'all'">Limpar filtros</button>
        </div>

        <div v-else class="expense-list">
          <div v-for="expense in filteredExpenses" :key="expense.id" class="expense-row" :class="{ 'is-pending': expense.status === 'pending' }">
            <div class="expense-info">
              <!-- Quick status toggle button -->
              <button
                class="status-toggle-badge"
                :class="expense.status === 'paid' ? 'status-paid' : 'status-pending'"
                :title="expense.status === 'paid' ? 'Despesa paga. Clique para marcar como pendente.' : 'Despesa a pagar. Clique para marcar como paga.'"
                @click="toggleExpenseStatus(expense)"
              >
                {{ expense.status === 'paid' ? '✓ Pago' : '⏳ A pagar' }}
              </button>

              <div class="category-dot" :title="expense.category">
                {{ expense.category.slice(0, 1) }}
              </div>

              <div class="expense-text-block">
                <strong>{{ expense.description }}</strong>
                <span class="expense-details">
                  {{ expense.category }} · {{ expense.paymentMethod }} · {{ expense.date }}
                  <em v-if="expense.recurring" class="recurring-tag">
                    · ↻ {{ expense.recurringFrequency === 'weekly' ? 'semanal' : expense.recurringFrequency === 'monthly' ? 'mensal' : 'anual' }}
                  </em>
                </span>
                <p v-if="expense.notes" class="expense-note">"{{ expense.notes }}"</p>
              </div>
            </div>

            <div class="expense-actions">
              <strong class="expense-amount-display">{{ formatCurrency(expense.amount) }}</strong>
              <div class="action-buttons-group">
                <button class="row-button" :aria-label="`Editar ${expense.description}`" @click="openEdit(expense)">Editar</button>
                <button class="row-button danger" :aria-label="`Remover ${expense.description}`" @click="askDelete(expense, 'expense')">Remover</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal: Adicionar / Editar Despesa -->
    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
      <form class="expense-form" @submit.prevent="saveExpense">
        <button type="button" class="close-button" aria-label="Fechar" @click="showForm = false">×</button>
        <p class="eyebrow">{{ editingExpense ? 'Ajustar Lançamento' : 'Novo Lançamento' }}</p>
        <h2>{{ editingExpense ? 'Editar Despesa' : 'Registrar Despesa' }}</h2>

        <label>
          Descrição da despesa
          <input v-model="form.description" required maxlength="120" placeholder="Ex.: Supermercado, Aluguel, Farmácia">
        </label>

        <div class="form-columns">
          <label>
            Valor (R$)
            <input v-model="form.amount" required min="0.01" step="0.01" type="number" placeholder="0,00">
          </label>
          <label>
            Data de vencimento / pagamento
            <input v-model="form.date" required type="date">
          </label>
        </div>

        <div class="form-columns">
          <label>
            Categoria
            <select v-model="form.category">
              <option v-for="cat in categoriesList" :key="cat">{{ cat }}</option>
            </select>
          </label>
          <label>
            Forma de pagamento
            <select v-model="form.paymentMethod">
              <option>Pix</option>
              <option>Cartão de débito</option>
              <option>Cartão de crédito</option>
              <option>Dinheiro</option>
              <option>Boleto bancário</option>
              <option>Transferência</option>
              <option>Outro</option>
            </select>
          </label>
        </div>

        <label>
          Status da despesa
          <select v-model="form.status">
            <option value="paid">✓ Já foi paga (descontar do saldo atual)</option>
            <option value="pending">⏳ A pagar / Prevista (aguardando vencimento)</option>
          </select>
        </label>

        <label>
          Observações adicionais (opcional)
          <textarea v-model="form.notes" maxlength="240" rows="2" placeholder="Ex.: Dividido em 2x, vencimento no dia 15..."></textarea>
        </label>

        <label class="checkbox-label">
          <input v-model="form.recurring" type="checkbox">
          Repetir periodicamente (despesa fixa recorrente)
        </label>

        <div v-if="form.recurring" class="recurring-box">
          <label>
            Frequência
            <select v-model="form.recurringFrequency">
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </label>
          <p class="form-help">
            O botão <strong>Recorrentes</strong> no menu permite gerar o lançamento do próximo ciclo na data de vencimento.
          </p>
        </div>

        <button class="primary-button submit-btn" type="submit">
          {{ editingExpense ? 'Salvar Alterações' : 'Confirmar Despesa' }}
        </button>
      </form>
    </div>

    <!-- Modal: Definir Saldo Inicial em Conta -->
    <div v-if="showBalanceModal" class="modal-backdrop" @click.self="showBalanceModal = false">
      <form class="expense-form balance-form" @submit.prevent="saveInitialBalance">
        <button type="button" class="close-button" aria-label="Fechar" @click="showBalanceModal = false">×</button>
        <p class="eyebrow">Configuração de Caixa</p>
        <h2>Saldo Disponível em Conta</h2>
        <p class="modal-lead">
          Quanto dinheiro você tem na conta agora para iniciar seu planejamento financeiro?
        </p>

        <label>
          Valor em Conta (R$)
          <input v-model="balanceInput" required min="0" step="0.01" type="number" placeholder="Ex: 3500,00" class="large-input">
        </label>

        <p class="form-help">
          💡 Esse valor não precisa ser dinheiro real e não conecta com nenhum banco. É apenas para você simular e acompanhar a diferença dos gastos.
        </p>

        <button class="primary-button submit-btn" type="submit">Salvar Saldo em Conta</button>
      </form>
    </div>

    <!-- Modal: Adicionar / Editar Entrada de Dinheiro -->
    <div v-if="showIncomeForm" class="modal-backdrop" @click.self="showIncomeForm = false">
      <form class="expense-form income-form" @submit.prevent="saveIncome">
        <button type="button" class="close-button" aria-label="Fechar" @click="showIncomeForm = false">×</button>
        <p class="eyebrow">{{ editingIncome ? 'Ajustar Entrada' : 'Nova Entrada' }}</p>
        <h2>{{ editingIncome ? 'Editar Entrada Financeira' : 'Adicionar ao Saldo' }}</h2>

        <label>
          Nome da fonte ou entrada
          <input v-model="incomeForm.name" required maxlength="60" placeholder="Ex.: Salário, Mesada, Freelance, Rendimentos">
        </label>

        <label>
          Valor a receber ou somar (R$)
          <input v-model="incomeForm.amount" required min="0.01" step="0.01" type="number" placeholder="0,00">
        </label>

        <label class="checkbox-label">
          <input v-model="incomeForm.recurring" type="checkbox">
          Entrada recorrente mensal
        </label>

        <button class="primary-button submit-btn" type="submit">
          {{ editingIncome ? 'Atualizar Entrada' : 'Adicionar Entrada' }}
        </button>
      </form>
    </div>

    <!-- Modal: Confirmação de Exclusão -->
    <div v-if="itemToDelete" class="modal-backdrop" role="presentation" @click.self="itemToDelete = null">
      <section class="confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
        <div class="confirmation-icon">!</div>
        <p class="eyebrow">Confirmação</p>
        <h2 id="delete-title">Remover este item?</h2>
        <p id="delete-description">
          Você está prestes a remover <strong>“{{ itemToDelete.name || itemToDelete.description }}”</strong>. Essa ação não poderá ser desfeita.
        </p>
        <div class="confirmation-actions">
          <button class="secondary-button" type="button" @click="itemToDelete = null">Cancelar</button>
          <button class="danger-button" type="button" @click="confirmDelete">Sim, remover</button>
        </div>
      </section>
    </div>
  </div>
</template>
