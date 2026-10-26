<script setup>
import { ref } from 'vue'
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
})

defineEmits(['open-balance-modal', 'open-income-form', 'edit-income', 'delete-income'])

const showIncomesList = ref(false)
</script>

<template>
  <article class="summary-card clean-card">
    <div class="card-top-row">
      <span class="card-label">Dinheiro Disponível</span>
      <div class="card-actions-quick">
        <button class="pill-action-btn" title="Definir saldo em conta" @click="$emit('open-balance-modal')">
          Ajustar Saldo
        </button>
        <button class="pill-action-btn" title="Adicionar entrada / salário" @click="$emit('open-income-form')">
          + Entrada
        </button>
      </div>
    </div>

    <strong class="metric-number">{{ formatCurrency(availableFunds) }}</strong>

    <div class="metric-sub-clean">
      <span>Saldo em conta: <strong>{{ formatCurrency(initialBalance) }}</strong></span>
      <span v-if="totalIncome > 0"> · +{{ formatCurrency(totalIncome) }} entradas</span>
    </div>

    <div v-if="incomeSources.length" class="income-sources-toggle-box">
      <button
        type="button"
        class="toggle-incomes-btn"
        @click="showIncomesList = !showIncomesList"
      >
        {{ showIncomesList ? 'Ocultar entradas (' + incomeSources.length + ')' : 'Ver entradas (' + incomeSources.length + ')' }}
      </button>

      <div v-if="showIncomesList" class="income-list-dropdown">
        <div v-for="source in incomeSources" :key="source.id" class="income-item-compact">
          <span class="income-name">{{ source.name }}</span>
          <span class="income-val">
            {{ formatCurrency(source.amount) }}
            <button class="edit-link-btn" title="Editar" @click="$emit('edit-income', source)">✎</button>
            <button
              class="remove-income"
              :aria-label="`Remover ${source.name}`"
              title="Remover"
              @click="$emit('delete-income', source)"
            >×</button>
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
