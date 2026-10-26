<script setup>
import AvailableFundsCard from './AvailableFundsCard.vue'
import ExpenseSummaryCard from './ExpenseSummaryCard.vue'
import ProjectedBalanceCard from './ProjectedBalanceCard.vue'

defineProps({
  availableFunds: {
    type: Number,
    required: true,
  },
  initialBalance: {
    type: Number,
    required: true,
  },
  rollover: {
    type: Number,
    default: 0,
  },
  totalIncome: {
    type: Number,
    required: true,
  },
  incomeSources: {
    type: Array,
    default: () => [],
  },
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
  projectedFinalBalance: {
    type: Number,
    required: true,
  },
  currentInHandBalance: {
    type: Number,
    required: true,
  },
})

defineEmits(['open-balance-modal', 'open-income-form', 'edit-income', 'delete-income'])
</script>

<template>
  <section class="summary-grid" aria-label="Resumo do período">
    <AvailableFundsCard
      :available-funds="availableFunds"
      :initial-balance="initialBalance"
      :rollover="rollover"
      :total-income="totalIncome"
      :income-sources="incomeSources"
      @open-balance-modal="$emit('open-balance-modal')"
      @open-income-form="$emit('open-income-form')"
      @edit-income="$emit('edit-income', $event)"
      @delete-income="$emit('delete-income', $event)"
    />

    <ExpenseSummaryCard
      :total-expenses="totalExpenses"
      :expenses-count="expensesCount"
      :paid-percentage="paidPercentage"
      :paid-expenses="paidExpenses"
      :pending-expenses="pendingExpenses"
      :overdue-count="overdueCount"
      :overdue-total="overdueTotal"
    />

    <ProjectedBalanceCard
      :projected-final-balance="projectedFinalBalance"
      :current-in-hand-balance="currentInHandBalance"
    />
  </section>
</template>
