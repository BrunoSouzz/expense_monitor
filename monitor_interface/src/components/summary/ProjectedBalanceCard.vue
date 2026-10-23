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
    class="summary-card featured"
    :class="{ warning: projectedFinalBalance < 0 }"
    data-guide="Projeção final do saldo após quitar todos os gastos previstos."
  >
    <div class="card-top-row">
      <div class="card-icon featured-icon" aria-hidden="true">
        <svg class="card-icon-svg" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="card-badge featured-badge">
        {{ projectedFinalBalance >= 0 ? 'Sobrará na conta' : 'Déficit Previsto' }}
      </span>
    </div>

    <p class="card-label">Saldo Final Estimado</p>
    <strong class="metric-number featured-number">{{ formatCurrency(projectedFinalBalance) }}</strong>

    <div class="projected-status-card">
      <div v-if="projectedFinalBalance >= 0" class="status-positive">
        <span>🎉 Economia estimada de <strong>{{ formatCurrency(projectedFinalBalance) }}</strong> ao fim do mês.</span>
        <small>Saldo restante em mãos agora: {{ formatCurrency(currentInHandBalance) }}</small>
      </div>
      <div v-else class="status-negative">
        <span>⚠️ Gastos superam o saldo em <strong>{{ formatCurrency(Math.abs(projectedFinalBalance)) }}</strong>.</span>
        <small>Ajuste despesas ou planeje novas entradas.</small>
      </div>
    </div>
  </article>
</template>
