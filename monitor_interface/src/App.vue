<script setup>
import { onMounted, ref } from 'vue'

// Composables
import { useFinance } from './composables/useFinance'
import { useAccessibility } from './composables/useAccessibility'
import { useVoiceAssistant } from './composables/useVoiceAssistant'
import { useToast } from './composables/useToast'

// Models and Validation
import { validateExpense, validateIncome, validateBalance, getTodayIso } from './models/types'
import { formatCurrency } from './utils/formatters'

// Layout Components
import SiteHeader from './components/layout/SiteHeader.vue'
import PeriodNavigator from './components/layout/PeriodNavigator.vue'

// Summary Components
import FinancialSummaryGrid from './components/summary/FinancialSummaryGrid.vue'

// Charts Component
import CategoryChartsCard from './components/charts/CategoryChartsCard.vue'

// Expenses Component
import ExpenseListCard from './components/expenses/ExpenseListCard.vue'

// Modals
import SettingsModal from './components/modals/SettingsModal.vue'
import ExpenseModal from './components/modals/ExpenseModal.vue'
import BalanceModal from './components/modals/BalanceModal.vue'
import IncomeModal from './components/modals/IncomeModal.vue'
import ConfirmDeleteModal from './components/common/ConfirmDeleteModal.vue'

// Common Components
import AppToast from './components/common/AppToast.vue'

// Initialize composables
const { toast, showToast } = useToast()

const {
  theme,
  fontScale,
  reducedMotion,
  lineSpacing,
  largeCursor,
  focusHighlight,
  applyTheme,
  applyFontScale,
  toggleMotion,
  toggleAccessibilityOption,
} = useAccessibility()

const finance = useFinance()

// Voice Assistant Commands Handler
function handleVoiceCommand(command) {
  const normalized = (command || '').toLowerCase()
  if (normalized.includes('parar') || normalized.includes('silêncio')) {
    stopSpeaking()
    return
  }
  if (normalized.includes('resumo') || normalized.includes('saldo')) {
    speakSummary()
    return
  }
  if (normalized.includes('nova despesa') || normalized.includes('adicionar despesa')) {
    openCreateExpense()
    speak('Formulário de nova despesa aberto.')
    return
  }
  if (normalized.includes('preferência') || normalized.includes('acessibilidade')) {
    showSettings.value = true
    speak('Preferências de acessibilidade abertas.')
    return
  }
  speak('Comando não reconhecido. Tente dizer resumo financeiro, nova despesa ou preferências.')
}

const {
  voiceEnabled,
  isListening,
  voiceStatus,
  speak,
  stopSpeaking,
  toggleVoiceAssistant,
  startListening,
  stopListening,
  handleGuideInteraction,
  hideGuide,
} = useVoiceAssistant({ onCommand: handleVoiceCommand })

function speakSummary() {
  const diff = finance.projectedFinalBalance.value
  const diffMsg = diff >= 0
    ? `Projeção positiva. Sobrará ${formatCurrency(diff)} no final do período.`
    : `Atenção. As despesas superam o saldo em ${formatCurrency(Math.abs(diff))}.`
  speak(
    `Resumo financeiro de ${finance.monthDisplayLabel.value}. Saldo disponível: ${formatCurrency(finance.availableFunds.value)}. Total de despesas: ${formatCurrency(finance.totalExpenses.value)}, sendo ${formatCurrency(finance.paidExpenses.value)} já pagas e ${formatCurrency(finance.pendingExpenses.value)} a pagar. ${diffMsg}`
  )
}

// Modal and dialog visibility state
const showSettings = ref(false)
const showExpenseModal = ref(false)
const editingExpense = ref(null)
const showBalanceModal = ref(false)
const showIncomeModal = ref(false)
const editingIncome = ref(null)
const itemToDelete = ref(null)

// Always use today's date for new expenses
const defaultExpenseDate = getTodayIso()

// Expense operations
function openCreateExpense() {
  editingExpense.value = null
  showExpenseModal.value = true
}

function openEditExpense(expense) {
  editingExpense.value = expense
  showExpenseModal.value = true
}

async function handleSaveExpense(formData) {
  const validation = validateExpense(formData)
  if (!validation.valid) {
    showToast(validation.message, 'error')
    return
  }
  try {
    const isEditing = Boolean(editingExpense.value)
    await finance.saveExpense(formData, editingExpense.value?.id)
    showExpenseModal.value = false
    showToast(isEditing ? 'Despesa atualizada com sucesso!' : 'Despesa registrada com sucesso!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function handleToggleExpenseStatus(expense) {
  try {
    await finance.toggleExpenseStatus(expense)
    showToast(expense.status === 'paid' ? 'Despesa marcada como Paga.' : 'Despesa marcada como A Pagar.', 'info')
  } catch (err) {
    showToast('Não foi possível alterar o status da despesa.', 'error')
  }
}

// Balance operations
function openBalanceModal() {
  showBalanceModal.value = true
}

async function handleSaveBalance(amount) {
  const validation = validateBalance(amount)
  if (!validation.valid) {
    showToast(validation.message, 'error')
    return
  }
  try {
    await finance.saveInitialBalance(amount)
    showBalanceModal.value = false
    showToast('Saldo em conta atualizado!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// Income operations
function openCreateIncome() {
  editingIncome.value = null
  showIncomeModal.value = true
}

function openEditIncome(income) {
  editingIncome.value = income
  showIncomeModal.value = true
}

async function handleSaveIncome(formData) {
  const validation = validateIncome(formData)
  if (!validation.valid) {
    showToast(validation.message, 'error')
    return
  }
  try {
    const isEditing = Boolean(editingIncome.value)
    await finance.saveIncome(formData, editingIncome.value?.id)
    showIncomeModal.value = false
    showToast(isEditing ? 'Entrada atualizada com sucesso!' : 'Entrada adicionada ao seu saldo!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// Delete confirmation handling
function askDelete(item, type) {
  itemToDelete.value = { ...item, type }
}

async function handleConfirmDelete() {
  if (!itemToDelete.value) return
  const item = itemToDelete.value
  try {
    if (item.type === 'expense') {
      await finance.deleteExpense(item.id)
    } else {
      await finance.deleteIncome(item.id)
    }
    itemToDelete.value = null
    showToast('Item removido com sucesso.', 'info')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// Backup & restore
async function handleExportBackup() {
  try {
    await finance.exportBackup()
    showToast('Backup exportado com sucesso!', 'success')
  } catch (err) {
    showToast('Erro ao exportar backup: ' + err.message, 'error')
  }
}

async function handleRestoreBackup(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    await finance.restoreBackup(file)
    showToast('Backup restaurado com sucesso!', 'success')
  } catch (err) {
    showToast('Falha ao restaurar backup: ' + err.message, 'error')
  } finally {
    event.target.value = ''
  }
}

// CSV export
function handleExportCsv() {
  const exported = finance.exportCsv()
  if (exported) {
    showToast('Planilha CSV exportada com sucesso!', 'success')
  } else {
    showToast('Não há despesas cadastradas para exportar.', 'info')
  }
}

onMounted(async () => {
  await finance.reloadAllData()
})
</script>

<template>
  <div
    class="app-shell font-sans"
    :class="[
      `theme-${theme}`,
      {
        'reduce-motion': reducedMotion,
        'wide-spacing': lineSpacing,
        'large-cursor': largeCursor,
        'focus-highlight': focusHighlight,
      },
    ]"
    :style="{ '--font-scale': fontScale }"
    @mouseover="handleGuideInteraction"
    @focusin="handleGuideInteraction"
    @mouseleave="hideGuide"
  >
    <!-- Toast Notification -->
    <AppToast :toast="toast" />

    <!-- Site Header & Settings Modal -->
    <SiteHeader
      :api-online="finance.apiOnline.value"
      :show-settings="showSettings"
      @toggle-settings="showSettings = !showSettings"
      @open-create="openCreateExpense"
    >
      <template #settings>
        <SettingsModal
          v-if="showSettings"
          :theme="theme"
          :font-scale="fontScale"
          :line-spacing="lineSpacing"
          :large-cursor="largeCursor"
          :focus-highlight="focusHighlight"
          :reduced-motion="reducedMotion"
          :voice-enabled="voiceEnabled"
          :voice-status="voiceStatus"
          :is-listening="isListening"
          @close="showSettings = false"
          @apply-theme="applyTheme"
          @apply-font-scale="applyFontScale"
          @toggle-option="toggleAccessibilityOption"
          @toggle-motion="toggleMotion"
          @toggle-voice="toggleVoiceAssistant"
          @speak-summary="speakSummary"
          @toggle-listening="isListening ? stopListening() : startListening()"
          @stop-speaking="stopSpeaking"
          @export-backup="handleExportBackup"
          @restore-backup="handleRestoreBackup"
        />
      </template>
    </SiteHeader>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Period Navigator -->
      <PeriodNavigator
        :month-display-label="finance.monthDisplayLabel.value"
        :selected-month="finance.selectedMonth.value"
        :current-month-iso="finance.currentMonthIso"
        :view-all-time="finance.viewAllTime.value"
        @change-month="finance.changeMonth"
        @select-current-month="finance.selectCurrentMonth"
        @toggle-view-all-time="finance.toggleViewAllTime"
        @export-csv="handleExportCsv"
      />

      <!-- Financial Metrics Summary Grid -->
      <FinancialSummaryGrid
        :available-funds="finance.availableFunds.value"
        :initial-balance="finance.initialBalance.value"
        :rollover="finance.rollover.value"
        :total-income="finance.totalIncome.value"
        :income-sources="finance.incomeSources.value"
        :total-expenses="finance.totalExpenses.value"
        :expenses-count="finance.expenses.value.length"
        :paid-percentage="finance.paidPercentage.value"
        :paid-expenses="finance.paidExpenses.value"
        :pending-expenses="finance.pendingExpenses.value"
        :overdue-count="finance.overdueCount.value"
        :overdue-total="finance.overdueTotal.value"
        :projected-final-balance="finance.projectedFinalBalance.value"
        :current-in-hand-balance="finance.currentInHandBalance.value"
        @open-balance-modal="openBalanceModal"
        @open-income-form="openCreateIncome"
        @edit-income="openEditIncome"
        @delete-income="askDelete($event, 'income')"
      />

      <!-- Category Charts Card (Collapsible) -->
      <CategoryChartsCard
        :chart-type="finance.chartType.value"
        :category-chart="finance.categoryChart.value"
        :pie-segments="finance.pieSegments.value"
        :pie-gradient="finance.pieGradient.value"
        @change-chart-type="finance.setChartType"
      />

      <!-- Expenses List Card with Search & Filters -->
      <ExpenseListCard
        :expenses="finance.expenses.value"
        :filtered-expenses="finance.filteredExpenses.value"
        :loading="finance.loading.value"
        :error="finance.error.value"
        :month-display-label="finance.monthDisplayLabel.value"
        :search-query="finance.searchQuery.value"
        :selected-category="finance.selectedCategory.value"
        :selected-status="finance.selectedStatus.value"
        :sort-order="finance.sortOrder.value"
        :categories="finance.allCategories.value"
        :overdue-count="finance.overdueCount.value"
        :overdue-total="finance.overdueTotal.value"
        @open-create="openCreateExpense"
        @toggle-status="handleToggleExpenseStatus"
        @edit="openEditExpense"
        @delete="askDelete($event, 'expense')"
        @retry="finance.reloadAllData"
        @clear-filters="finance.clearFilters"
        @update:search-query="finance.searchQuery.value = $event"
        @update:selected-category="finance.selectedCategory.value = $event"
        @update:selected-status="finance.selectedStatus.value = $event"
        @update:sort-order="finance.sortOrder.value = $event"
      />
    </main>

    <!-- Modals -->
    <ExpenseModal
      :show="showExpenseModal"
      :editing-expense="editingExpense"
      :default-date="defaultExpenseDate"
      :categories="finance.allCategories.value"
      @close="showExpenseModal = false"
      @save="handleSaveExpense"
    />

    <BalanceModal
      :show="showBalanceModal"
      :initial-balance="finance.initialBalance.value"
      @close="showBalanceModal = false"
      @save="handleSaveBalance"
    />

    <IncomeModal
      :show="showIncomeModal"
      :editing-income="editingIncome"
      @close="showIncomeModal = false"
      @save="handleSaveIncome"
    />

    <!-- Confirm Item Deletion Modal -->
    <ConfirmDeleteModal
      :item="itemToDelete"
      @cancel="itemToDelete = null"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
