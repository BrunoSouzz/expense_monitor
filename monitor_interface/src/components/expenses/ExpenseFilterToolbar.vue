<script setup>
import { CATEGORIES_LIST, SORT_OPTIONS, STATUS_OPTIONS } from '../../constants/categories'

defineProps({
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
  statusOptions: {
    type: Array,
    default: () => STATUS_OPTIONS,
  },
  sortOptions: {
    type: Array,
    default: () => SORT_OPTIONS,
  },
})

defineEmits([
  'update:searchQuery',
  'update:selectedCategory',
  'update:selectedStatus',
  'update:sortOrder',
  'clear-search',
])
</script>

<template>
  <div class="filter-toolbar">
    <div class="search-input-wrap">
      <span class="search-icon">🔍</span>
      <input
        :value="searchQuery"
        type="text"
        placeholder="Filtrar por nome ou notas..."
        class="search-input"
        aria-label="Pesquisar despesas"
        @input="$emit('update:searchQuery', $event.target.value)"
      >
      <button
        v-if="searchQuery"
        class="clear-search-btn"
        aria-label="Limpar busca"
        @click="$emit('clear-search')"
      >
        ×
      </button>
    </div>

    <div class="filter-controls">
      <select
        :value="selectedCategory"
        class="filter-select"
        aria-label="Filtrar por categoria"
        @change="$emit('update:selectedCategory', $event.target.value)"
      >
        <option value="Todas">Todas as categorias</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <select
        :value="selectedStatus"
        class="filter-select"
        aria-label="Filtrar por status"
        @change="$emit('update:selectedStatus', $event.target.value)"
      >
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <select
        :value="sortOrder"
        class="filter-select"
        aria-label="Ordenar despesas"
        @change="$emit('update:sortOrder', $event.target.value)"
      >
        <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>
  </div>
</template>
