<script setup>
import { computed, onMounted, reactive, ref, toRef } from 'vue'
import { useFinance } from './composables/useFinance.js'
import { usePreferences } from './composables/usePreferences.js'
import { useToasts } from './composables/useToasts.js'
import { useVoice } from './composables/useVoice.js'
import { currentMonth, formatCurrency, monthLabel, monthName, plural, shiftMonth } from './lib/format.js'
import CategoryBreakdown from './components/CategoryBreakdown.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import ExpenseDialog from './components/ExpenseDialog.vue'
import ExpenseList from './components/ExpenseList.vue'
import IncomeDialog from './components/IncomeDialog.vue'
import IncomePanel from './components/IncomePanel.vue'
import PreferencesDialog from './components/PreferencesDialog.vue'
import ToastStack from './components/ToastStack.vue'

const finance = useFinance()
const { month, expenses, income, summary, loading, loadError } = finance
const prefs = reactive(usePreferences())
const { push } = useToasts()

// Só uma janela aberta por vez. `item: null` significa "novo".
const dialog = ref(null) // { kind: 'expense' | 'income' | 'delete' | 'preferences', item?, ... }
const closeDialog = () => { dialog.value = null }

const balance = computed(() => summary.value?.balance ?? 0)
const spent = computed(() => summary.value?.spent.total ?? 0)
const spentCount = computed(() => summary.value?.spent.count ?? 0)
const incomeTotal = computed(() => summary.value?.income.total ?? 0)
const allTimeSpent = computed(() => Math.round((incomeTotal.value - balance.value) * 100) / 100)
const categories = computed(() => summary.value?.spent.byCategory ?? [])
const monthWord = computed(() => monthName(month.value))
const isCurrentMonth = computed(() => month.value === currentMonth())

const voice = useVoice({
  enabled: toRef(prefs, 'voiceEnabled'),
  summaryText: () => {
    const top = categories.value[0]
    const topText = top ? ` A maior categoria é ${top.category}, com ${formatCurrency(top.total)}.` : ''
    return `Resumo de ${monthLabel(month.value)}. Saldo disponível: ${formatCurrency(balance.value)}. `
      + `Gastos no mês: ${formatCurrency(spent.value)}, em ${plural(spentCount.value, 'lançamento', 'lançamentos')}.${topText}`
  },
  onNewExpense: () => { dialog.value = { kind: 'expense', item: null } },
  onPreferences: () => { dialog.value = { kind: 'preferences' } },
})

async function saveExpense(payload) {
  const id = dialog.value.item?.id
  await finance.saveExpense(payload, id)
  push(id ? 'Despesa atualizada.' : 'Despesa adicionada.')
}

async function saveIncome(payload) {
  const id = dialog.value.item?.id
  await finance.saveIncome(payload, id)
  push(id ? 'Entrada atualizada.' : 'Entrada adicionada.')
}

const askRemoveExpense = (item) => {
  dialog.value = {
    kind: 'delete',
    title: 'Remover despesa?',
    message: `“${item.description}” será removida e o valor volta para o saldo. Isso não pode ser desfeito.`,
    run: async () => { await finance.removeExpense(item.id); push('Despesa removida.') },
  }
}

const askRemoveIncome = (item) => {
  dialog.value = {
    kind: 'delete',
    title: 'Remover entrada?',
    message: `“${item.name}” será removida e o saldo diminui nesse valor. Isso não pode ser desfeito.`,
    run: async () => { await finance.removeIncome(item.id); push('Entrada removida.') },
  }
}

async function processRecurring() {
  try {
    const { processed } = await finance.processRecurring()
    const total = processed.expenses + processed.income
    push(total
      ? `${plural(processed.expenses, 'despesa lançada', 'despesas lançadas')} e ${plural(processed.income, 'entrada lançada', 'entradas lançadas')}.`
      : 'Nenhuma recorrência vencida.')
  } catch (failure) {
    push(failure.message, 'error')
  }
}

onMounted(() => finance.refresh())
</script>

<template>
  <div class="min-h-screen" @mouseover="voice.onGuideOver" @focusin="voice.onGuideOver" @mouseleave="voice.onGuideLeave">
    <a href="#conteudo" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">Ir para o conteúdo</a>

    <header class="border-b border-line">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
        <div class="flex items-center gap-2.5 font-serif text-lg" aria-label="Expense Monitor">
          <img src="/expense-mark.svg" alt="" class="size-8">
          <span>Expense <strong>Monitor</strong></span>
        </div>

        <nav class="order-last flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto" aria-label="Mês exibido">
          <button type="button" class="btn-ghost !px-3 text-lg" aria-label="Mês anterior" @click="month = shiftMonth(month, -1)">‹</button>
          <span class="min-w-40 text-center font-semibold capitalize" aria-live="polite">{{ monthLabel(month) }}</span>
          <button type="button" class="btn-ghost !px-3 text-lg" aria-label="Próximo mês" @click="month = shiftMonth(month, 1)">›</button>
          <button v-if="!isCurrentMonth" type="button" class="btn-secondary !px-3 !py-1.5" @click="month = currentMonth()">Hoje</button>
        </nav>

        <div class="flex items-center gap-2">
          <button type="button" class="btn-ghost" aria-label="Preferências" @click="dialog = { kind: 'preferences' }">☼ <span class="hidden sm:inline">Preferências</span></button>
          <button type="button" class="btn-primary" @click="dialog = { kind: 'expense', item: null }">+ Nova despesa</button>
        </div>
      </div>
    </header>

    <main id="conteudo" class="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <section aria-label="Resumo" class="max-w-2xl">
        <p class="font-semibold text-muted">Saldo disponível</p>
        <p
          class="mt-1 font-serif text-5xl font-bold tabular-nums leading-none sm:text-7xl"
          :class="balance < 0 ? 'text-danger' : 'text-ink'"
        >{{ summary ? formatCurrency(balance) : '—' }}</p>
        <p class="mt-4 text-lg">
          Você gastou <strong class="tabular-nums">{{ formatCurrency(spent) }}</strong> em {{ monthWord }}
          <span class="text-muted">({{ plural(spentCount, 'lançamento', 'lançamentos') }}).</span>
        </p>
        <p class="mt-1 text-sm text-muted">Saldo = entradas ({{ formatCurrency(incomeTotal) }}) − despesas de todos os meses ({{ formatCurrency(allTimeSpent) }}).</p>
      </section>

      <div class="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <ExpenseList
          :expenses="expenses"
          :title="`Despesas de ${monthWord}`"
          :loading="loading"
          :error="loadError"
          @add="dialog = { kind: 'expense', item: null }"
          @edit="(item) => dialog = { kind: 'expense', item }"
          @remove="askRemoveExpense"
          @retry="finance.refresh"
          @process-recurring="processRecurring"
        />
        <div class="grid gap-6">
          <CategoryBreakdown :items="categories" :month-name="monthWord" />
          <IncomePanel
            :income="income"
            @add="dialog = { kind: 'income', item: null }"
            @edit="(item) => dialog = { kind: 'income', item }"
            @remove="askRemoveIncome"
          />
        </div>
      </div>
    </main>

    <ExpenseDialog v-if="dialog?.kind === 'expense'" :expense="dialog.item" :save="saveExpense" @close="closeDialog" />
    <IncomeDialog v-else-if="dialog?.kind === 'income'" :income="dialog.item" :save="saveIncome" @close="closeDialog" />
    <ConfirmDialog v-else-if="dialog?.kind === 'delete'" :title="dialog.title" :message="dialog.message" :confirm="dialog.run" @close="closeDialog" />
    <PreferencesDialog v-else-if="dialog?.kind === 'preferences'" :prefs="prefs" :voice="voice" @close="closeDialog" />

    <ToastStack />
  </div>
</template>
