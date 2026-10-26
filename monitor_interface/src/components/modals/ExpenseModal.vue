<script setup>
import { ref, watch } from 'vue'
import { createDefaultExpense } from '../../models/types'
import { CATEGORIES_LIST, PAYMENT_METHODS, RECURRING_FREQUENCIES } from '../../constants/categories'

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
    default: () => new Date().toISOString().slice(0, 10),
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

const form = ref(createDefaultExpense(props.defaultDate))

watch(
  () => [props.show, props.editingExpense],
  ([show, editing]) => {
    if (show) {
      if (editing) {
        form.value = { ...editing, amount: Number(editing.amount) }
      } else {
        form.value = createDefaultExpense(props.defaultDate)
      }
    }
  },
  { immediate: true }
)

function handleSubmit() {
  emit('save', {
    ...form.value,
    amount: Number(form.value.amount),
    id: props.editingExpense?.id,
  })
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <form class="expense-form" @submit.prevent="handleSubmit">
      <button type="button" class="close-button" aria-label="Fechar" @click="$emit('close')">×</button>
      <p class="eyebrow">{{ editingExpense ? 'Ajustar Lançamento' : 'Novo Lançamento' }}</p>
      <h2>{{ editingExpense ? 'Editar Despesa' : 'Registrar Despesa' }}</h2>

      <label>
        Descrição da despesa
        <input
          v-model="form.description"
          required
          maxlength="120"
          placeholder="Ex.: Supermercado, Aluguel, Farmácia"
        >
      </label>

      <div class="form-columns">
        <label>
          Valor (R$)
          <input
            v-model="form.amount"
            required
            min="0.01"
            step="0.01"
            type="number"
            placeholder="0,00"
          >
        </label>
        <label>
          Data de vencimento / pagamento
          <input
            v-model="form.date"
            required
            type="date"
          >
        </label>
      </div>

      <div class="form-columns">
        <label>
          Categoria
          <select v-model="form.category">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </label>
        <label>
          Forma de pagamento
          <select v-model="form.paymentMethod">
            <option v-for="method in paymentMethods" :key="method" :value="method">{{ method }}</option>
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
        <textarea
          v-model="form.notes"
          maxlength="240"
          rows="2"
          placeholder="Ex.: Dividido em 2x, vencimento no dia 15..."
        ></textarea>
      </label>

      <label class="checkbox-label">
        <input v-model="form.recurring" type="checkbox">
        Repetir periodicamente (despesa fixa recorrente)
      </label>

      <div v-if="form.recurring" class="recurring-box">
        <label>
          Frequência
          <select v-model="form.recurringFrequency">
            <option
              v-for="freq in recurringFrequencies"
              :key="freq.value"
              :value="freq.value"
            >
              {{ freq.label }}
            </option>
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
</template>
