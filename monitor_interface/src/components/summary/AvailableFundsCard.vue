<script setup>
import { formatCurrency } from '../../utils/formatters'

defineProps({
  availableFunds: {
    type: Number,
    required: true,
  },
  initialBalance: {
    type: Number,
    required: true,
  },
  totalIncome: {
    type: Number,
    required: true,
  },
  incomeSources: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['open-balance-modal', 'open-income-form', 'edit-income', 'delete-income'])
</script>

<template>
  <article class="summary-card" data-guide="Saldo disponível. Mostra seu saldo inicial mais outras entradas financeiras.">
    <div class="card-top-row">
      <div class="card-icon soft" aria-hidden="true">
        <svg class="card-icon-svg" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="16.5" cy="12" r="1.5" fill="currentColor"/>
          <path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      </div>
      <div class="card-actions-quick">
        <button class="pill-action-btn" @click="$emit('open-balance-modal')">Ajustar Saldo</button>
        <button class="pill-action-btn" @click="$emit('open-income-form')">+ Entrada</button>
      </div>
    </div>

    <p class="card-label">Dinheiro Disponível no Período</p>
    <strong class="metric-number">{{ formatCurrency(availableFunds) }}</strong>
    <span class="metric-sub">
      Saldo em conta: {{ formatCurrency(initialBalance) }}
      <span v-if="incomeSources.length"> · +{{ formatCurrency(totalIncome) }} em outras entradas</span>
    </span>

    <div v-if="incomeSources.length" class="income-list">
      <div v-for="source in incomeSources" :key="source.id" class="income-item">
        <span class="income-name">{{ source.name }}</span>
        <span class="income-val">
          {{ formatCurrency(source.amount) }}
          <button class="edit-link-btn" title="Editar entrada" @click="$emit('edit-income', source)">✎</button>
          <button
            class="remove-income"
            :aria-label="`Remover ${source.name}`"
            title="Remover entrada"
            @click="$emit('delete-income', source)"
          >×</button>
        </span>
      </div>
    </div>
  </article>
</template>
