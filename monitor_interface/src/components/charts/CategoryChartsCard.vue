<script setup>
import { formatCurrency } from '../../utils/formatters'

defineProps({
  chartType: {
    type: String,
    default: 'bars',
  },
  categoryChart: {
    type: Array,
    default: () => [],
  },
  pieSegments: {
    type: Array,
    default: () => [],
  },
  pieGradient: {
    type: String,
    default: 'var(--surface-soft) 0% 100%',
  },
})

defineEmits(['change-chart-type'])
</script>

<template>
  <section class="summary-card chart-full-card" data-guide="Distribuição de gastos por categoria.">
    <div class="chart-header-row">
      <div>
        <h3>Distribuição por Categoria</h3>
        <p class="section-sub">Veja onde está a maior parte das suas saídas financeiras.</p>
      </div>
      <div class="chart-options" role="group" aria-label="Visualização do gráfico">
        <button
          :class="{ selected: chartType === 'bars' }"
          @click="$emit('change-chart-type', 'bars')"
        >
          Barras
        </button>
        <button
          :class="{ selected: chartType === 'columns' }"
          @click="$emit('change-chart-type', 'columns')"
        >
          Colunas
        </button>
        <button
          :class="{ selected: chartType === 'pie' }"
          @click="$emit('change-chart-type', 'pie')"
        >
          Pizza
        </button>
      </div>
    </div>

    <!-- Bars Chart View -->
    <div v-if="categoryChart.length && chartType === 'bars'" class="category-chart-bars">
      <div v-for="(item, index) in categoryChart" :key="item.category" class="chart-bar-row">
        <div class="chart-label">
          <span>{{ item.category }}</span>
          <div class="chart-val-box">
            <span class="chart-money-val">{{ formatCurrency(item.amount) }}</span>
            <strong>{{ item.percentage }}%</strong>
          </div>
        </div>
        <div class="chart-horizontal-track">
          <div
            class="chart-horizontal-bar"
            :class="`chart-color-${index}`"
            :style="{ width: `${Math.max(item.percentage, 2)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Columns Chart View -->
    <div v-else-if="categoryChart.length && chartType === 'columns'" class="category-chart-columns">
      <div v-for="(item, index) in categoryChart" :key="item.category" class="chart-column-item">
        <div class="column-value">{{ item.percentage }}%</div>
        <div class="column-track">
          <div
            class="column-bar"
            :class="`chart-color-${index}`"
            :style="{ height: `${Math.max(item.percentage, 8)}%` }"
          ></div>
        </div>
        <span class="column-category">{{ item.category }}</span>
        <small class="column-amount">{{ formatCurrency(item.amount) }}</small>
      </div>
    </div>

    <!-- Pie / Donut Chart View -->
    <div v-else-if="categoryChart.length" class="category-chart-pie">
      <div class="pie-visual" :style="{ background: `conic-gradient(from -90deg, ${pieGradient})` }">
        <span
          v-for="item in pieSegments"
          :key="item.category"
          class="pie-label"
          :style="{ transform: `rotate(${item.midpoint}deg) translateY(-40px) rotate(-${item.midpoint}deg)` }"
        >
          {{ item.percentage }}%
        </span>
      </div>
      <div class="pie-legend">
        <div v-for="item in pieSegments" :key="item.category" class="legend-item">
          <i class="legend-color" :class="`legend-color-${item.index}`"></i>
          <span class="legend-cat-name">{{ item.category }}</span>
          <span class="legend-cat-money">{{ formatCurrency(item.amount) }}</span>
          <strong>{{ item.percentage }}%</strong>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state-compact">
      Nenhuma despesa registrada neste período para exibir gráficos.
    </div>
  </section>
</template>
