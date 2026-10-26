<script setup>
import { ref, computed, watch } from 'vue'
import { createDefaultExpense, getTodayIso } from '../../models/types'
import { CATEGORIES_LIST, PAYMENT_METHODS, RECURRING_FREQUENCIES } from '../../constants/categories'
import { formatCurrency } from '../../utils/formatters'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  editingExpense: {
    type: Object,
    default: null,
  },
  defaultDate: {
    type: String,
    default: () => getTodayIso(),
  },
  categories: {
    type: Array,
    default: () => CATEGORIES_LIST,
  },
  paymentMethods: {
    type: Array,
    default: () => PAYMENT_METHODS,
  },
  recurringFrequencies: {
    type: Array,
    default: () => RECURRING_FREQUENCIES,
  },
})

const emit = defineEmits(['close', 'save'])

const form = ref(createDefaultExpense(getTodayIso()))
const isCustomCategory = ref(false)
const customCategoryName = ref('')
const entryType = ref('single') // 'single' | 'recurring' | 'installment'
const installmentsCount = ref(2)
const installmentType = ref('total') // 'total' | 'installment_value'

watch(
  () => [props.show, props.editingExpense],
  ([show, editing]) => {
    if (show) {
      if (editing) {
        form.value = {
          ...editing,
          amount: Number(editing.amount),
        }
        if (editing.recurring) {
          entryType.value = 'recurring'
        } else if (editing.installmentTotal && editing.installmentTotal > 1) {
          entryType.value = 'installment'
          installmentsCount.value = editing.installmentTotal
        } else {
          entryType.value = 'single'
        }
        if (props.categories.includes(editing.category)) {
          isCustomCategory.value = false
          customCategoryName.value = ''
        } else {
          isCustomCategory.value = true
          customCategoryName.value = editing.category
        }
      } else {
        // ALWAYS default to today's date for a new expense
        form.value = createDefaultExpense(getTodayIso())
        entryType.value = 'single'
        isCustomCategory.value = false
        customCategoryName.value = ''
        installmentsCount.value = 2
        installmentType.value = 'total'
      }
    }
  },
  { immediate: true }
)

function setToday() {
  form.value.date = getTodayIso()
}

function handleCategoryChange(e) {
  if (e.target.value === '__custom__') {
    isCustomCategory.value = true
  } else {
    isCustomCategory.value = false
  }
}

// Live preview of installments
const installmentPreview = computed(() => {
  const count = Number(installmentsCount.value) || 2
  const rawAmt = Number(form.value.amount) || 0
  if (rawAmt <= 0) return null

  if (installmentType.value === 'installment_value') {
    const each = rawAmt
    const total = rawAmt * count
    return `${count}x de ${formatCurrency(each)} (Total: ${formatCurrency(total)})`
  } else {
    const each = Math.round((rawAmt / count) * 100) / 100
    return `${count}x de ${formatCurrency(each)} (Total: ${formatCurrency(rawAmt)})`
  }
})

function handleSubmit() {
  const finalCategory = isCustomCategory.value
    ? customCategoryName.value.trim()
    : form.value.category

  const isRecurring = entryType.value === 'recurring'
  const isInstallment = entryType.value === 'installment'

  emit('save', {
    ...form.value,
    amount: Number(form.value.amount),
    category: finalCategory,
    recurring: isRecurring,
    recurringFrequency: isRecurring ? (form.value.recurringFrequency || 'monthly') : 'monthly',
    installments: isInstallment ? Number(installmentsCount.value) : null,
    installmentType: isInstallment ? installmentType.value : 'total',
    isCustomCategory: isCustomCategory.value,
    customCategoryName: customCategoryName.value.trim(),
    id: props.editingExpense?.id,
  })
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <form class="expense-form clean-modal" @submit.prevent="handleSubmit">
      <button type="button" class="close-button" aria-label="Fechar" @click="$emit('close')">×</button>
      <div class="form-header-clean">
        <span class="eyebrow">{{ editingExpense ? 'Ajustar Lançamento' : 'Novo Lançamento' }}</span>
        <h2>{{ editingExpense ? 'Editar Despesa' : 'Registrar Despesa' }}</h2>
      </div>

      <!-- Description Input -->
      <label class="clean-field">
        <span class="field-label">Descrição</span>
        <input
          v-model="form.description"
          required
          maxlength="120"
          placeholder="Ex.: Supermercado, Aluguel, Farmácia"
          class="clean-input"
        >
      </label>

      <!-- Amount and Date in 2 columns -->
      <div class="form-columns">
        <label class="clean-field">
          <span class="field-label">Valor (R$)</span>
          <input
            v-model="form.amount"
            required
            min="0.01"
            step="0.01"
            type="number"
            placeholder="0,00"
            class="clean-input"
          >
        </label>
        <label class="clean-field">
          <span class="field-label">
            Data
            <button type="button" class="btn-quick-today" @click="setToday">Hoje</button>
          </span>
          <input
            v-model="form.date"
            required
            type="date"
            class="clean-input"
          >
        </label>
      </div>

      <!-- Category & Payment Method -->
      <div class="form-columns">
        <label class="clean-field">
          <span class="field-label">Categoria</span>
          <select
            v-model="form.category"
            class="clean-select"
            @change="handleCategoryChange"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            <option value="__custom__">✏️ + Escrever nova categoria...</option>
          </select>
        </label>
        <label class="clean-field">
          <span class="field-label">Forma de pagamento</span>
          <select v-model="form.paymentMethod" class="clean-select">
            <option v-for="method in paymentMethods" :key="method" :value="method">{{ method }}</option>
          </select>
        </label>
      </div>

      <!-- Custom Category Input when selected -->
      <div v-if="isCustomCategory" class="custom-cat-box">
        <label class="clean-field">
          <span class="field-label">Nome da nova categoria personalizada:</span>
          <input
            v-model="customCategoryName"
            required
            maxlength="50"
            placeholder="Ex.: Academia, Material Escolar, Hobby..."
            class="clean-input"
          >
        </label>
      </div>

      <!-- Type of Entry: Single, Recurring, Installment -->
      <div v-if="!editingExpense" class="entry-type-section">
        <span class="field-label">Tipo de Lançamento</span>
        <div class="entry-type-pills">
          <button
            type="button"
            class="type-pill-btn"
            :class="{ active: entryType === 'single' }"
            @click="entryType = 'single'"
          >
            Única
          </button>
          <button
            type="button"
            class="type-pill-btn"
            :class="{ active: entryType === 'recurring' }"
            @click="entryType = 'recurring'"
          >
            ↻ Recorrência Fixa
          </button>
          <button
            type="button"
            class="type-pill-btn"
            :class="{ active: entryType === 'installment' }"
            @click="entryType = 'installment'"
          >
            💳 Parcelamento Automático
          </button>
        </div>
      </div>

      <!-- Recurring Options Box -->
      <div v-if="entryType === 'recurring'" class="feature-box">
        <div class="feature-box-header">
          <strong>Cobrança Recorrente Fixa</strong>
          <span class="feature-box-badge">Automática</span>
        </div>
        <p class="feature-box-help">
          O sistema cobrará automaticamente esta despesa no próximo mês e nos meses seguintes.
        </p>
        <label class="clean-field">
          <span class="field-label">Frequência</span>
          <select v-model="form.recurringFrequency" class="clean-select">
            <option
              v-for="freq in recurringFrequencies"
              :key="freq.value"
              :value="freq.value"
            >
              {{ freq.label }}
            </option>
          </select>
        </label>
      </div>

      <!-- Installment Options Box -->
      <div v-if="entryType === 'installment'" class="feature-box">
        <div class="feature-box-header">
          <strong>Parcelamento Automático</strong>
          <span class="feature-box-badge">Próximos Meses</span>
        </div>
        <p class="feature-box-help">
          O sistema criará e atribuirá sozinho as parcelas dos próximos meses no mesmo dia de vencimento.
        </p>

        <div class="form-columns">
          <label class="clean-field">
            <span class="field-label">Número de parcelas</span>
            <select v-model="installmentsCount" class="clean-select">
              <option v-for="n in [2,3,4,5,6,7,8,9,10,11,12,18,24,36,48]" :key="n" :value="n">
                {{ n }}x parcelas
              </option>
            </select>
          </label>

          <label class="clean-field">
            <span class="field-label">O valor informado é:</span>
            <select v-model="installmentType" class="clean-select">
              <option value="total">Valor Total da Compra</option>
              <option value="installment_value">Valor de Cada Parcela</option>
            </select>
          </label>
        </div>

        <div v-if="installmentPreview" class="installment-summary-pill">
          💡 {{ installmentPreview }}
        </div>
      </div>

      <!-- Status -->
      <label class="clean-field">
        <span class="field-label">Status da despesa {{ entryType === 'installment' ? '(1ª parcela)' : '' }}</span>
        <select v-model="form.status" class="clean-select">
          <option value="paid">✓ Já foi paga (descontar do saldo atual)</option>
          <option value="pending">⏳ A pagar / Prevista (aguardando vencimento)</option>
        </select>
      </label>

      <!-- Notes -->
      <label class="clean-field">
        <span class="field-label">Observações (opcional)</span>
        <textarea
          v-model="form.notes"
          maxlength="240"
          rows="2"
          placeholder="Ex.: Vencimento todo dia 10, garantia, etc."
          class="clean-textarea"
        ></textarea>
      </label>

      <button class="primary-button submit-btn clean-submit" type="submit">
        {{ editingExpense ? 'Salvar Alterações' : 'Confirmar Despesa' }}
      </button>
    </form>
  </div>
</template>
