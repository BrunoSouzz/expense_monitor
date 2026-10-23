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
})
</script>

<template>
  <article class="summary-card" data-guide="Despesas do período. Total gasto ou planejado para o mês.">
    <div class="card-top-row">
      <div class="card-icon expense-icon" aria-hidden="true">
        <svg class="card-icon-svg" viewBox="0 0 24 24" fill="none">
          <path d="M5 19 19 5M10 5h9v9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="card-badge">{{ expensesCount }} lançamentos</span>
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
</template>
