<script setup>
import { computed } from 'vue'
import { formatCurrency } from '../../utils/formatters'
import { getTodayIso } from '../../models/types'

const props = defineProps({
  expense: {
    type: Object,
    required: true,
  },
})

defineEmits(['toggle-status', 'edit', 'delete'])

const todayIso = getTodayIso()
const isOverdue = computed(() => {
  return props.expense.status === 'pending' && Boolean(props.expense.date) && props.expense.date < todayIso
})

// Format YYYY-MM-DD to DD/MM/YYYY
const formattedDate = computed(() => {
  if (!props.expense.date || !props.expense.date.includes('-')) return props.expense.date
  const [y, m, d] = props.expense.date.split('-')
  return `${d}/${m}/${y}`
})
</script>

<template>
  <div
    class="expense-row"
    :class="{
      'is-pending': expense.status === 'pending' && !isOverdue,
      'is-overdue': isOverdue,
    }"
  >
    <div class="expense-info">
      <!-- Quick status toggle button -->
      <button
        class="status-toggle-badge"
        :class="{
          'status-paid': expense.status === 'paid',
          'status-pending': expense.status === 'pending' && !isOverdue,
          'status-overdue-btn': isOverdue,
        }"
        :title="expense.status === 'paid' ? 'Despesa paga. Clique para marcar como a pagar.' : 'Clique para marcar como paga.'"
        @click="$emit('toggle-status', expense)"
      >
        {{ expense.status === 'paid' ? '✓ Pago' : '⏳ A pagar' }}
      </button>

      <!-- Red Overdue Tag (Tag vermelha de atrasado) -->
      <span v-if="isOverdue" class="badge-overdue" title="Pagamento atrasado! Venceu em {{ formattedDate }}">
        🔴 Atrasado
      </span>

      <div class="expense-text-block">
        <div class="expense-title-row">
          <strong class="expense-desc">{{ expense.description }}</strong>
          <span v-if="expense.recurring" class="badge-tag-pill recurring" title="Despesa recorrente fixa">↻ Fixa</span>
          <span
            v-if="expense.installmentTotal && expense.installmentTotal > 1"
            class="badge-tag-pill installment"
            title="Parcela"
          >
            💳 {{ expense.installmentIndex }}/{{ expense.installmentTotal }}
          </span>
        </div>

        <span class="expense-details">
          {{ expense.category }} · {{ expense.paymentMethod }} · Vencimento: {{ formattedDate }}
        </span>
        <p v-if="expense.notes" class="expense-note">"{{ expense.notes }}"</p>
      </div>
    </div>

    <div class="expense-actions">
      <strong class="expense-amount-display" :class="{ 'text-overdue': isOverdue }">
        {{ formatCurrency(expense.amount) }}
      </strong>
      <div class="action-buttons-group">
        <button
          class="row-button"
          :aria-label="`Editar ${expense.description}`"
          title="Editar despesa"
          @click="$emit('edit', expense)"
        >
          Editar
        </button>
        <button
          class="row-button danger"
          :aria-label="`Remover ${expense.description}`"
          title="Excluir despesa"
          @click="$emit('delete', expense)"
        >
          Remover
        </button>
      </div>
    </div>
  </div>
</template>
