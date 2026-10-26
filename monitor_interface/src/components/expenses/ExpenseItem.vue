<script setup>
import { formatCurrency } from '../../utils/formatters'

defineProps({
  expense: {
    type: Object,
    required: true,
  },
})

defineEmits(['toggle-status', 'edit', 'delete'])
</script>

<template>
  <div class="expense-row" :class="{ 'is-pending': expense.status === 'pending' }">
    <div class="expense-info">
      <!-- Quick status toggle button -->
      <button
        class="status-toggle-badge"
        :class="expense.status === 'paid' ? 'status-paid' : 'status-pending'"
        :title="expense.status === 'paid' ? 'Despesa paga. Clique para marcar como pendente.' : 'Despesa a pagar. Clique para marcar como paga.'"
        @click="$emit('toggle-status', expense)"
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
        <button
          class="row-button"
          :aria-label="`Editar ${expense.description}`"
          @click="$emit('edit', expense)"
        >
          Editar
        </button>
        <button
          class="row-button danger"
          :aria-label="`Remover ${expense.description}`"
          @click="$emit('delete', expense)"
        >
          Remover
        </button>
      </div>
    </div>
  </div>
</template>
