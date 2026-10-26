<script setup>
import { formatCurrency } from '../../utils/formatters'

defineProps({
  projectedFinalBalance: {
    type: Number,
    required: true,
  },
  currentInHandBalance: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <article
    class="summary-card featured clean-card"
    :class="{ warning: projectedFinalBalance < 0 }"
  >
    <div class="card-top-row">
      <span class="card-label featured-label">
        {{ projectedFinalBalance >= 0 ? 'Sobra Prevista' : 'Déficit Previsto' }}
      </span>
      <span class="card-badge featured-badge">
        {{ projectedFinalBalance >= 0 ? 'Para o próximo mês' : 'Atenção' }}
      </span>
    </div>

    <strong class="metric-number featured-number">{{ formatCurrency(projectedFinalBalance) }}</strong>

    <div class="projected-status-card-clean">
      <div v-if="projectedFinalBalance >= 0" class="status-positive-clean">
        <span>🎉 Sobrará <strong>{{ formatCurrency(projectedFinalBalance) }}</strong> (adicionado ao próximo mês).</span>
        <small>Em mãos agora: {{ formatCurrency(currentInHandBalance) }}</small>
      </div>
      <div v-else class="status-negative-clean">
        <span>⚠️ Gastos superam o saldo em <strong>{{ formatCurrency(Math.abs(projectedFinalBalance)) }}</strong>.</span>
        <small>Ajuste despesas ou planeje novas entradas.</small>
      </div>
    </div>
  </article>
</template>
