<script setup>
import { computed, onMounted, ref } from 'vue'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const expenses = ref([])
const loading = ref(true)
const error = ref('')
const showForm = ref(false)
const showSettings = ref(false)
const showIncomeForm = ref(false)
const editingExpense = ref(null)
const theme = ref(localStorage.getItem('expense-theme') || 'pastel')
const fontScale = ref(Number(localStorage.getItem('expense-font-scale') || 1))
const reducedMotion = ref(localStorage.getItem('expense-reduced-motion') === 'true')
const storedIncomeSources = localStorage.getItem('expense-income-sources')
const parsedIncomeSources = storedIncomeSources ? JSON.parse(storedIncomeSources) : []
const initialIncomeSources = parsedIncomeSources.filter((source) => source.id !== 'salary')
const incomeSources = ref(initialIncomeSources)
if (storedIncomeSources && initialIncomeSources.length !== parsedIncomeSources.length) {
  localStorage.setItem('expense-income-sources', JSON.stringify(initialIncomeSources))
}
const incomeForm = ref({ name: '', amount: '' })
const form = ref({ description: '', amount: '', category: 'Alimentação', paymentMethod: 'Cartão de débito', notes: '', recurring: false, date: new Date().toISOString().slice(0, 10) })

const total = computed(() => expenses.value.reduce((sum, expense) => sum + Number(expense.amount), 0))
const formattedTotal = computed(() => formatCurrency(total.value))
const availableBalance = computed(() => incomeSources.value.reduce((sum, source) => sum + Number(source.amount), 0))
const budgetProgress = computed(() => availableBalance.value ? Math.min((total.value / availableBalance.value) * 100, 100) : 0)

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

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function openCreate() {
  editingExpense.value = null
  form.value = { description: '', amount: '', category: 'Alimentação', paymentMethod: 'Cartão de débito', notes: '', recurring: false, date: new Date().toISOString().slice(0, 10) }
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
    await loadExpenses()
  } catch (requestError) { error.value = requestError.message }
}

async function removeExpense(expense) {
  if (!window.confirm(`Remover "${expense.description}"?`)) return
  try { await request(`/api/v1/expenses/${expense.id}`, { method: 'DELETE' }); await loadExpenses() }
  catch (requestError) { error.value = requestError.message }
}

function applyTheme(nextTheme) {
  theme.value = nextTheme
  localStorage.setItem('expense-theme', nextTheme)
}

function applyFontScale(value) {
  fontScale.value = Number(value)
  localStorage.setItem('expense-font-scale', String(value))
}

function toggleMotion() {
  reducedMotion.value = !reducedMotion.value
  localStorage.setItem('expense-reduced-motion', String(reducedMotion.value))
}

function openIncomeForm() {
  incomeForm.value = { name: '', amount: '' }
  showIncomeForm.value = true
}

function saveIncome() {
  const amount = Number(incomeForm.value.amount)
  const name = incomeForm.value.name.trim()
  if (!name || !Number.isFinite(amount) || amount <= 0) return
  incomeSources.value.push({ id: crypto.randomUUID(), name, amount })
  localStorage.setItem('expense-income-sources', JSON.stringify(incomeSources.value))
  showIncomeForm.value = false
}

function removeIncome(source) {
  incomeSources.value = incomeSources.value.filter((item) => item.id !== source.id)
  localStorage.setItem('expense-income-sources', JSON.stringify(incomeSources.value))
}

onMounted(loadExpenses)
</script>

<template>
  <div class="app-shell font-sans" :class="[`theme-${theme}`, { 'reduce-motion': reducedMotion }]" :style="{ '--font-scale': fontScale }">
    <header class="site-header">
      <div class="header-content">
        <a href="#" class="brand" aria-label="Expense Monitor - início">
          <img src="/expense-mark.svg" alt="" class="brand-mark">
          <span>Expense <strong>Monitor</strong></span>
        </a>
        <div class="header-actions">
          <button class="icon-button hint" data-tooltip="Escolha o tema, o tamanho do texto e as animações." aria-label="Abrir preferências de acessibilidade" @click="showSettings = !showSettings">☼ <span class="hide-mobile">Preferências</span></button>
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
        <article class="summary-card featured">
          <div class="card-icon">↗</div>
          <p>Despesas no período</p>
          <strong>{{ formattedTotal }}</strong>
          <span>{{ expenses.length }} lançamentos registrados</span>
        </article>
        <article class="summary-card">
          <div class="card-heading"><p>Entradas do mês</p><span>{{ Math.round(budgetProgress) }}%</span></div>
          <strong>{{ formatCurrency(availableBalance) }}</strong>
          <div class="progress-hint hint" data-tooltip="Percentual das entradas já comprometido com despesas."><div class="progress-track" aria-label="Percentual do orçamento utilizado"><div class="progress-bar" :style="{ width: `${budgetProgress}%` }"></div></div></div>
          <span v-if="incomeSources.length">{{ incomeSources.length }} fonte{{ incomeSources.length === 1 ? '' : 's' }} cadastrada{{ incomeSources.length === 1 ? '' : 's' }}</span>
          <span v-else class="empty-income">Nenhuma entrada cadastrada. <button class="text-button hint" data-tooltip="Adicione salário, mesada ou qualquer outra entrada." @click="openIncomeForm">Começar</button></span>
        </article>
        <article class="summary-card">
          <div class="card-icon soft">♡</div>
          <div class="card-heading"><p>Saldo disponível</p><button class="add-income-button hint" data-tooltip="Cadastre salário, mesada, freelance ou outra entrada." aria-label="Adicionar entrada" @click="openIncomeForm">+ Adicionar</button></div>
          <strong class="green">{{ formatCurrency(availableBalance - total) }}</strong>
          <div class="income-list">
            <div v-for="source in incomeSources" :key="source.id" class="income-item">
              <span>{{ source.name }}</span>
              <span>{{ formatCurrency(source.amount) }} <button class="remove-income" :aria-label="`Remover ${source.name}`" @click="removeIncome(source)">×</button></span>
            </div>
          </div>
          <span v-if="incomeSources.length">Entradas menos despesas</span>
          <span v-else>Nenhuma entrada adicionada ainda.</span>
        </article>
      </section>

      <section class="expenses-card">
        <div class="section-heading">
          <div><h2>Suas despesas</h2><p>Edite valores, categorias e datas sempre que precisar.</p></div>
          <button class="secondary-button hint" data-tooltip="Você poderá editar valor, data, categoria e outros detalhes." @click="openCreate">Adicionar lançamento</button>
        </div>
        <div v-if="loading" class="empty-state">Carregando seus lançamentos...</div>
        <div v-else-if="error" class="empty-state error-message">{{ error }} <button class="text-button" @click="loadExpenses">Tentar novamente</button></div>
        <div v-else-if="!expenses.length" class="empty-state">Você ainda não possui despesas. Adicione seu primeiro lançamento.</div>
        <div v-else class="expense-list">
          <div v-for="expense in expenses" :key="expense.id" class="expense-row">
            <div class="expense-info"><div class="category-dot">{{ expense.category.slice(0, 1) }}</div><div><strong>{{ expense.description }}</strong><span>{{ expense.category }} · {{ expense.paymentMethod }} · {{ expense.date }}<em v-if="expense.recurring"> · Recorrente</em></span></div></div>
            <div class="expense-actions"><strong>{{ formatCurrency(expense.amount) }}</strong><button class="row-button" :aria-label="`Editar ${expense.description}`" @click="openEdit(expense)">Editar</button><button class="row-button danger" :aria-label="`Remover ${expense.description}`" @click="removeExpense(expense)">Remover</button></div>
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
        <label class="checkbox-label"><input v-model="form.recurring" type="checkbox"> Esta é uma despesa recorrente</label>
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
  </div>
</template>
