<script setup>
import ExpenseFilterToolbar from './ExpenseFilterToolbar.vue'
import ExpenseItem from './ExpenseItem.vue'
import { CATEGORIES_LIST } from '../../constants/categories'
import { formatCurrency } from '../../utils/formatters'

defineProps({
  expenses: {
    type: Array,
    default: () => [],
  },
  filteredExpenses: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  monthDisplayLabel: {
    type: String,
    required: true,
  },
  searchQuery: {
    type: String,
    default: '',
  },
  selectedCategory: {
    type: String,
    default: 'Todas',
  },
  selectedStatus: {
    type: String,
    default: 'all',
  },
  sortOrder: {
    type: String,
    default: 'date_desc',
  },
  categories: {
    type: Array,
    default: () => CATEGORIES_LIST,
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

defineEmits([
  'open-create',
  'toggle-status',
  'edit',
  'delete',
  'retry',
  'clear-filters',
  'update:searchQuery',
  'update:selectedCategory',
  'update:selectedStatus',
  'update:sortOrder',
])
</script>

<template>
  <section class="expenses-card">
    <div class="expenses-header">
      <div class="header-titles">
        <h2>Despesas de {{ monthDisplayLabel }}</h2>
        <span class="expenses-count-badge">
          {{ expenses.length }} {{ expenses.length === 1 ? 'lançamento' : 'lançamentos' }}
        </span>
        <button
          v-if="overdueCount > 0"
          type="button"
          class="alert-overdue-pill"
          :class="{ active: selectedStatus === 'overdue' }"
          title="Clique para filtrar apenas despesas atrasadas"
          @click="$emit('update:selectedStatus', selectedStatus === 'overdue' ? 'all' : 'overdue')"
        >
          ⚠️ {{ overdueCount }} atrasada{{ overdueCount > 1 ? 's' : '' }} ({{ formatCurrency(overdueTotal) }})
        </button>
      </div>
      <button class="primary-button small" @click="$emit('open-create')">+ Nova Despesa</button>
    </div>

    <!-- Filter & Search Toolbar -->
    <ExpenseFilterToolbar
      :search-query="searchQuery"
      :selected-category="selectedCategory"
      :selected-status="selectedStatus"
      :sort-order="sortOrder"
      :categories="categories"
      @update:search-query="$emit('update:searchQuery', $event)"
      @update:selected-category="$emit('update:selectedCategory', $event)"
      @update:selected-status="$emit('update:selectedStatus', $event)"
      @update:sort-order="$emit('update:sortOrder', $event)"
      @clear-search="$emit('update:searchQuery', '')"
    />

    <!-- Expense Rows / States -->
    <div v-if="loading" class="empty-state">
      <div class="spinner"></div>
      <p>Carregando despesas...</p>
    </div>

    <div v-else-if="error" class="empty-state error-message">
      <p>{{ error }}</p>
      <button class="text-button" @click="$emit('retry')">Tentar novamente</button>
    </div>

    <div v-else-if="!expenses.length" class="empty-state">
      <p>Nenhuma despesa encontrada para {{ monthDisplayLabel }}.</p>
      <button class="secondary-button small" style="margin-top: 12px;" @click="$emit('open-create')">
        Adicionar primeira despesa
      </button>
    </div>

    <div v-else-if="!filteredExpenses.length" class="empty-state">
      <p>Nenhuma despesa encontrada para os filtros aplicados.</p>
      <button class="text-button" @click="$emit('clear-filters')">Limpar filtros</button>
    </div>

    <div v-else class="expense-list">
      <ExpenseItem
        v-for="expense in filteredExpenses"
        :key="expense.id"
        :expense="expense"
        @toggle-status="$emit('toggle-status', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </section>
</template>
