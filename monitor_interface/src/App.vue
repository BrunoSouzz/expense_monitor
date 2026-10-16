<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const expenses = ref([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const showSettings = ref(false)
const showIncomeForm = ref(false)
const itemToDelete = ref(null)
const editingExpense = ref(null)
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
const incomeSources = ref([])
const incomeForm = ref({ name: '', amount: '' })
const chartType = ref(localStorage.getItem('expense-chart-type') || 'bars')
const form = ref({ description: '', amount: '', category: 'Alimentação', paymentMethod: 'Cartão de débito', notes: '', recurring: false, recurringFrequency: 'weekly', date: new Date().toISOString().slice(0, 10) })

document.documentElement.style.setProperty('--font-scale', String(fontScale.value))

const total = computed(() => expenses.value.reduce((sum, expense) => sum + Number(expense.amount), 0))
const formattedTotal = computed(() => formatCurrency(total.value))
const availableBalance = computed(() => incomeSources.value.reduce((sum, source) => sum + Number(source.amount), 0))
const categorySummary = computed(() => {
  const totals = expenses.value.reduce((categories, expense) => {
    categories[expense.category] = (categories[expense.category] || 0) + Number(expense.amount)
    return categories
  }, {})
  return Object.entries(totals).sort(([, first], [, second]) => second - first)
})
const categoryChart = computed(() => categorySummary.value.slice(0, 4).map(([category, amount]) => ({
  category,
  amount,
  percentage: total.value ? Math.round((amount / total.value) * 100) : 0,
})))
const chartColors = ['var(--accent)', 'var(--support)', 'var(--success)', 'var(--accent-dark)']
const pieSegments = computed(() => {
  let start = 0
  return categoryChart.value.map((item, index) => {
    const size = (item.amount / total.value) * 100
    const end = start + size
    const segment = { ...item, index, start, end, midpoint: (start + end) * 1.8 }
    start = end
    return segment
  })
})
const pieGradient = computed(() => pieSegments.value.map((item) => (
  `${chartColors[item.index]} ${item.start}% ${item.end}%, var(--surface) ${item.end}% ${Math.min(item.end + 0.7, 100)}%`
)).join(', '))

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'Não foi possível concluir a operação.')
  }
  return response.status === 204 ? null : response.json()
}

async function loadExpenses() {
  loading.value = true
  try { expenses.value = await request('/api/v1/expenses'); error.value = '' }
  catch (requestError) { error.value = requestError.message }
  finally { loading.value = false }
}

async function loadIncomeSources() {
  try { incomeSources.value = await request('/api/v1/income') }
  catch (requestError) { error.value = requestError.message }
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function setChartType(type) {
  chartType.value = type
  localStorage.setItem('expense-chart-type', type)
}

function openCreate() {
  editingExpense.value = null
  form.value = { description: '', amount: '', category: 'Alimentação', paymentMethod: 'Cartão de débito', notes: '', recurring: false, recurringFrequency: 'weekly', date: new Date().toISOString().slice(0, 10) }
  showForm.value = true
}

const recurringDescription = computed(() => form.value.recurring
  ? 'Esta despesa ficará configurada como recorrente, mas nada será lançado automaticamente. Use o botão “Recorrentes” para confirmar as cobranças vencidas.'
  : '')

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
    await loadExpenses()
  } catch (requestError) { error.value = requestError.message }
}

async function processRecurringExpenses() {
  try {
    const result = await request('/api/v1/recurring/process', { method: 'POST' })
    await Promise.all([loadExpenses(), loadIncomeSources()])
    return result
  } catch (requestError) { error.value = requestError.message }
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
    if (item.type === 'expense') await loadExpenses()
    else await loadIncomeSources()
  } catch (requestError) { error.value = requestError.message }
}

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
  const category = categoryChart.value[0]
  const categoryText = category
    ? `A categoria com maior gasto é ${category.category}, com ${formatCurrency(category.amount)}, representando ${category.percentage} por cento.`
    : 'Ainda não há despesas cadastradas por categoria.'
  speak(`Resumo financeiro. Despesas no período: ${formattedTotal.value}. Saldo disponível: ${formatCurrency(availableBalance.value - total.value)}. ${expenses.value.length} lançamentos registrados. ${categoryText}`)
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
  speechRecognition.onstart = () => { isListening.value = true; voiceStatus.value = 'Ouvindo um comando.' }
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

function openIncomeForm() {
  incomeForm.value = { name: '', amount: '' }
  showIncomeForm.value = true
}

function saveIncome() {
  const amount = Number(incomeForm.value.amount)
  const name = incomeForm.value.name.trim()
  if (!name || !Number.isFinite(amount) || amount <= 0) return
  request('/api/v1/income', { method: 'POST', body: JSON.stringify({ ...incomeForm.value, name, amount }) })
    .then(async () => { showIncomeForm.value = false; await loadIncomeSources() })
    .catch((requestError) => { error.value = requestError.message })
}

onMounted(async () => {
  await Promise.all([loadExpenses(), loadIncomeSources()])
})

onUnmounted(() => {
  stopListening()
  stopSpeaking()
  clearTimeout(guideTimer)
})
</script>

<template>
  <div class="app-shell font-sans" :class="[`theme-${theme}`, { 'reduce-motion': reducedMotion, 'wide-spacing': lineSpacing, 'large-cursor': largeCursor, 'focus-highlight': focusHighlight }]" :style="{ '--font-scale': fontScale }" @mouseover="handleGuideInteraction" @focusin="handleGuideInteraction" @mouseleave="hideGuide">
    <header class="site-header">
      <div class="header-content">
        <a href="#" class="brand" aria-label="Expense Monitor - início" data-guide="Logo Expense Monitor. Volta para o início.">
          <img src="/expense-mark.svg" alt="" class="brand-mark">
          <span>Expense <strong>Monitor</strong></span>
        </a>
        <div class="header-actions">
          <button class="icon-button hint" data-tooltip="Escolha o tema, o tamanho do texto e as animações." aria-label="Abrir preferências de acessibilidade" @click="showSettings = !showSettings">☼ <span class="hide-mobile">Preferências</span></button>
          <button class="secondary-button small hint" data-tooltip="Processa cobranças e entradas recorrentes que já venceram." @click="processRecurringExpenses">↻ Recorrentes</button>
          <button class="primary-button small hint" data-tooltip="Registre um novo gasto para acompanhar seu saldo." @click="openCreate">+ Nova despesa</button>
        </div>
      </div>
      <div v-if="showSettings" class="settings-panel" aria-label="Preferências de acessibilidade">
        <div>
          <p class="setting-title">Aparência</p>
          <div class="theme-options" role="group" aria-label="Tema">
            <button :class="{ selected: theme === 'pastel' }" @click="applyTheme('pastel')">Pastel</button>
            <button :class="{ selected: theme === 'twilight' }" @click="applyTheme('twilight')">Crepúsculo</button>
            <button :class="{ selected: theme === 'contrast' }" @click="applyTheme('contrast')">Contraste</button>
          </div>
        </div>
        <label class="setting-row">Tamanho do texto
          <input type="range" min="0.9" max="1.2" step="0.05" :value="fontScale" aria-label="Tamanho do texto" @input="applyFontScale($event.target.value)">
        </label>
        <label class="setting-row setting-toggle">
          <span>Espaçamento entre linhas</span>
          <input type="checkbox" :checked="lineSpacing" aria-label="Ativar espaçamento entre linhas" @change="toggleAccessibilityOption('lineSpacing', $event.target.checked)">
        </label>
        <label class="setting-row setting-toggle">
          <span>Cursor ampliado</span>
          <input type="checkbox" :checked="largeCursor" aria-label="Ativar cursor ampliado" @change="toggleAccessibilityOption('largeCursor', $event.target.checked)">
        </label>
        <label class="setting-row setting-toggle">
          <span>Destaque de foco</span>
          <input type="checkbox" :checked="focusHighlight" aria-label="Ativar destaque de foco" @change="toggleAccessibilityOption('focusHighlight', $event.target.checked)">
        </label>
        <div class="voice-settings">
          <p class="setting-title">Assistente de voz</p>
          <label class="setting-row setting-toggle">
            <span>Leitura, guia e comandos por voz</span>
            <input type="checkbox" :checked="voiceEnabled" aria-label="Ativar assistente de voz" @change="toggleVoiceAssistant">
          </label>
          <div v-if="voiceEnabled" class="voice-actions">
            <button class="text-button" @click="speakSummary">Ler resumo</button>
            <button class="text-button" @click="isListening ? stopListening() : startListening()">{{ isListening ? 'Parar escuta' : 'Ouvir comando' }}</button>
            <button class="text-button" @click="stopSpeaking">Parar leitura</button>
          </div>
          <p v-if="voiceStatus" class="form-help" aria-live="polite">{{ voiceStatus }}</p>
        </div>
        <button class="text-button" @click="toggleMotion">{{ reducedMotion ? 'Ativar animações' : 'Reduzir animações' }}</button>
      </div>
    </header>

    <main class="main-content">
      <section class="intro">
        <p class="eyebrow">Seu espaço financeiro</p>
        <h1>Uma visão leve das suas despesas.</h1>
        <p class="intro-copy">Organize seus gastos com clareza, faça ajustes quando precisar e mantenha seu planejamento no seu ritmo.</p>
      </section>

      <section class="summary-grid" aria-label="Resumo financeiro">
        <article class="summary-card featured" data-guide="Despesas no período. Mostra o total gasto e a quantidade de lançamentos.">
          <div class="card-icon" aria-hidden="true">
            <svg class="card-icon-svg" viewBox="0 0 24 24" fill="none">
              <path d="M5 19 19 5M10 5h9v9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p>Despesas no período</p>
          <strong>{{ formattedTotal }}</strong>
          <span>{{ expenses.length }} lançamentos registrados</span>
        </article>
        <article class="summary-card" data-guide="Gastos por categoria. Mostra como suas despesas estão distribuídas.">
          <div class="chart-heading">
            <div class="card-heading"><p>Gastos por categoria</p><span v-if="categoryChart.length">{{ categorySummary.length }} no total</span></div>
            <div class="chart-options" role="group" aria-label="Tipo de gráfico">
              <button :class="{ selected: chartType === 'bars' }" @click="setChartType('bars')">Barras</button>
              <button :class="{ selected: chartType === 'columns' }" @click="setChartType('columns')">Colunas</button>
              <button :class="{ selected: chartType === 'pie' }" @click="setChartType('pie')">Pizza</button>
            </div>
          </div>
          <div v-if="categoryChart.length && chartType === 'bars'" class="category-chart-bars" aria-label="Distribuição das despesas por categoria">
            <div v-for="(item, index) in categoryChart" :key="item.category" class="chart-bar-row">
              <div class="chart-label"><span>{{ item.category }}</span><strong>{{ item.percentage }}%</strong></div>
              <div class="chart-horizontal-track" role="img" :aria-label="`${item.category}: ${item.percentage}% das despesas`">
                <div class="chart-horizontal-bar" :class="`chart-color-${index}`" :style="{ width: `${Math.max(item.percentage, 2)}%` }"></div>
              </div>
            </div>
          </div>
          <div v-else-if="categoryChart.length && chartType === 'columns'" class="category-chart-columns" aria-label="Distribuição das despesas por categoria">
            <div v-for="(item, index) in categoryChart" :key="item.category" class="chart-column-item">
              <div class="column-value">{{ item.percentage }}%</div>
              <div class="column-track" role="img" :aria-label="`${item.category}: ${item.percentage}% das despesas`">
                <div class="column-bar" :class="`chart-color-${index}`" :style="{ height: `${Math.max(item.percentage, 5)}%` }"></div>
              </div>
              <span>{{ item.category }}</span>
            </div>
          </div>
          <div v-else-if="categoryChart.length" class="category-chart-pie" aria-label="Distribuição das despesas por categoria">
            <div class="pie-visual" role="img" aria-label="Gráfico de pizza com a distribuição das despesas por categoria" :style="{ background: `conic-gradient(from -90deg, ${pieGradient})` }">
              <span v-for="item in pieSegments" :key="item.category" class="pie-label" :style="{ transform: `rotate(${item.midpoint}deg) translateY(-38px) rotate(-${item.midpoint}deg)` }">{{ item.percentage }}%</span>
            </div>
            <div class="pie-legend">
              <div v-for="item in pieSegments" :key="item.category" class="legend-item"><i class="legend-color" :class="`legend-color-${item.index}`"></i><span>{{ item.category }}</span><strong>{{ item.percentage }}%</strong></div>
            </div>
          </div>
          <span v-if="categoryChart.length">As categorias com maior impacto no seu período.</span>
          <span v-else>Cadastre despesas para visualizar a distribuição dos gastos.</span>
        </article>
        <article class="summary-card" data-guide="Saldo disponível. Mostra suas entradas menos o total de despesas.">
          <div class="card-icon soft" aria-hidden="true">
            <svg class="card-icon-svg" viewBox="0 0 24 24" fill="none">
              <path d="M4 17.5V20h2.5L18.8 7.7a1.8 1.8 0 0 0-2.5-2.5L4 17.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="m14.8 6.5 2.7 2.7M4 16.8l3.2 3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="card-heading"><p>Saldo disponível</p><button class="add-income-button hint" data-tooltip="Cadastre salário, mesada, freelance ou outra entrada." aria-label="Adicionar entrada" @click="openIncomeForm">+ Adicionar</button></div>
          <strong class="green">{{ formatCurrency(availableBalance - total) }}</strong>
          <div class="income-list">
            <div v-for="source in incomeSources" :key="source.id" class="income-item">
              <span>{{ source.name }}</span>
              <span>{{ formatCurrency(source.amount) }} <em v-if="source.recurring"> · {{ source.recurringFrequency === 'weekly' ? 'semanal' : source.recurringFrequency === 'monthly' ? 'mensal' : 'anual' }}</em> <button class="remove-income" :aria-label="`Remover ${source.name}`" @click="askDelete(source, 'income')">×</button></span>
            </div>
          </div>
          <span v-if="incomeSources.length">Entradas menos despesas</span>
          <span v-else>Nenhuma entrada adicionada ainda.</span>
        </article>
      </section>

      <section class="expenses-card" data-guide="Suas despesas. Aqui você pode consultar, editar e remover seus lançamentos.">
        <div class="section-heading">
          <div><h2>Suas despesas</h2><p>Edite valores, categorias e datas sempre que precisar.</p></div>
        </div>
        <div v-if="loading" class="empty-state">Carregando seus lançamentos...</div>
        <div v-else-if="error" class="empty-state error-message">{{ error }} <button class="text-button" @click="loadExpenses">Tentar novamente</button></div>
        <div v-else-if="!expenses.length" class="empty-state">Você ainda não possui despesas. Adicione seu primeiro lançamento.</div>
        <div v-else class="expense-list">
          <div v-for="expense in expenses" :key="expense.id" class="expense-row">
            <div class="expense-info"><div class="category-dot">{{ expense.category.slice(0, 1) }}</div><div><strong>{{ expense.description }}</strong><span>{{ expense.category }} · {{ expense.paymentMethod }} · {{ expense.date }}<em v-if="expense.recurring"> · Recorrente ({{ expense.recurringFrequency === 'weekly' ? 'semanal' : expense.recurringFrequency === 'monthly' ? 'mensal' : 'anual' }})</em></span></div></div>
            <div class="expense-actions"><strong>{{ formatCurrency(expense.amount) }}</strong><button class="row-button" :aria-label="`Editar ${expense.description}`" @click="openEdit(expense)">Editar</button><button class="row-button danger" :aria-label="`Remover ${expense.description}`" @click="askDelete(expense, 'expense')">Remover</button></div>
          </div>
        </div>
      </section>
    </main>

    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
      <form class="expense-form" @submit.prevent="saveExpense">
        <button type="button" class="close-button" aria-label="Fechar formulário" @click="showForm = false">×</button>
        <p class="eyebrow">{{ editingExpense ? 'Ajustar lançamento' : 'Novo lançamento' }}</p>
        <h2>{{ editingExpense ? 'Edite sua despesa' : 'Registre uma despesa' }}</h2>
        <label>Descrição<input v-model="form.description" required maxlength="120" placeholder="Ex.: Café da manhã"></label>
        <div class="form-columns"><label>Valor (R$)<input v-model="form.amount" required min="0.01" step="0.01" type="number" placeholder="0,00"></label><label>Data<input v-model="form.date" required type="date"></label></div>
        <label>Categoria<select v-model="form.category"><option>Alimentação</option><option>Moradia</option><option>Transporte</option><option>Lazer</option><option>Saúde</option><option>Outros</option></select></label>
        <label>Forma de pagamento<select v-model="form.paymentMethod"><option>Cartão de débito</option><option>Cartão de crédito</option><option>Pix</option><option>Dinheiro</option><option>Transferência</option><option>Outro</option></select></label>
        <label>Observações<textarea v-model="form.notes" maxlength="240" rows="3" placeholder="Adicione um detalhe opcional"></textarea></label>
        <label class="checkbox-label"><input v-model="form.recurring" type="checkbox"> Cobrança recorrente</label>
        <p v-if="form.recurring" class="form-help recurring-help">{{ recurringDescription }}</p>
        <label v-if="form.recurring">Periodicidade<select v-model="form.recurringFrequency"><option value="weekly">Semanal</option><option value="monthly">Mensal</option><option value="yearly">Anual</option></select></label>
        <button class="primary-button" type="submit">{{ editingExpense ? 'Salvar alterações' : 'Adicionar despesa' }}</button>
      </form>
    </div>

    <div v-if="showIncomeForm" class="modal-backdrop" @click.self="showIncomeForm = false">
      <form class="expense-form income-form" @submit.prevent="saveIncome">
        <button type="button" class="close-button" aria-label="Fechar formulário" @click="showIncomeForm = false">×</button>
        <p class="eyebrow">Nova entrada</p>
        <h2>Adicionar ao seu saldo</h2>
        <label>Nome da entrada<input v-model="incomeForm.name" required maxlength="60" placeholder="Ex.: Salário, mesada ou freelance"></label>
        <label>Valor (R$)<input v-model="incomeForm.amount" required min="0.01" step="0.01" type="number" placeholder="0,00"></label>
        <button class="primary-button" type="submit">Adicionar entrada</button>
      </form>
    </div>

    <div v-if="itemToDelete" class="modal-backdrop" role="presentation" @click.self="itemToDelete = null">
      <section class="confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
        <div class="confirmation-icon">!</div>
        <p class="eyebrow">Atenção</p>
        <h2 id="delete-title">Remover este item?</h2>
        <p id="delete-description">Você está prestes a remover <strong>“{{ itemToDelete.name || itemToDelete.description }}”</strong>. Essa ação não pode ser desfeita.</p>
        <div class="confirmation-actions">
          <button class="secondary-button" type="button" @click="itemToDelete = null">Cancelar</button>
          <button class="danger-button" type="button" @click="confirmDelete">Sim, remover</button>
        </div>
      </section>
    </div>
  </div>
</template>
