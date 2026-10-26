<script setup>
import { formatCurrency } from '../../utils/formatters'

defineProps({
  totalExpenses: {
    type: Number,
    required: true,
  },
  expensesCount: {
    type: Number,
    required: true,
  },
  paidPercentage: {
    type: Number,
    required: true,
  },
  paidExpenses: {
    type: Number,
    required: true,
  },
  pendingExpenses: {
    type: Number,
    required: true,
  },
  overdueCount: {
    type: Number,
    default: 0,
  },
  overdueTotal: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <article class="summary-card clean-card">
    <div class="card-top-row">
      <span class="card-label">Total de Despesas</span>
      <span class="card-badge-clean">{{ expensesCount }} contas</span>
    </div>

    <strong class="metric-number">{{ formatCurrency(totalExpenses) }}</strong>

    <!-- Paid vs Pending Breakdown -->
    <div class="expense-breakdown">
      <div class="breakdown-bar-track" :title="`${paidPercentage}% pagas`">
        <div class="breakdown-bar-fill" :style="{ width: `${paidPercentage}%` }"></div>
      </div>
      <div class="breakdown-legend-clean">
        <span class="legend-paid">✓ Pagas: <strong>{{ formatCurrency(paidExpenses) }}</strong></span>
        <span class="legend-pending">⏳ A Pagar: <strong>{{ formatCurrency(pendingExpenses) }}</strong></span>
        <span v-if="overdueCount > 0" class="legend-overdue-clean">
          🔴 Atrasadas: <strong>{{ formatCurrency(overdueTotal) }}</strong>
        </span>
      </div>
    </div>
  </article>
</template>
