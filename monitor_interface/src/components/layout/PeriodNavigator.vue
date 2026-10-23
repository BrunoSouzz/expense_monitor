<script setup>
defineProps({
  monthDisplayLabel: {
    type: String,
    required: true,
  },
  selectedMonth: {
    type: String,
    required: true,
  },
  currentMonthIso: {
    type: String,
    required: true,
  },
  viewAllTime: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['change-month', 'select-current-month', 'toggle-view-all-time', 'export-csv'])
</script>

<template>
  <section class="period-navigator-bar" aria-label="Controle de período">
    <div class="period-controls">
      <button class="period-nav-btn" aria-label="Mês anterior" @click="$emit('change-month', -1)">◀</button>
      <div class="period-title-box">
        <span class="period-label">Período de Análise</span>
        <strong class="period-current">{{ monthDisplayLabel }}</strong>
      </div>
      <button class="period-nav-btn" aria-label="Próximo mês" @click="$emit('change-month', 1)">▶</button>
    </div>

    <div class="period-quick-actions">
      <button
        class="pill-btn"
        :class="{ active: !viewAllTime && selectedMonth === currentMonthIso }"
        @click="$emit('select-current-month')"
      >
        Mês Atual
      </button>
      <button
        class="pill-btn"
        :class="{ active: viewAllTime }"
        @click="$emit('toggle-view-all-time')"
      >
        {{ viewAllTime ? 'Visão Mensal' : 'Ver Todos os Meses' }}
      </button>
      <button
        class="pill-btn secondary"
        title="Exportar tabela de despesas para Excel / Planilhas"
        @click="$emit('export-csv')"
      >
        📥 Exportar CSV
      </button>
    </div>
  </section>
</template>
