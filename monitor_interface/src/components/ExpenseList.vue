<script setup>
import { FREQUENCY_LABELS, formatCurrency, formatDate } from '../lib/format.js'

defineProps({
  expenses: { type: Array, required: true },
  title: { type: String, required: true },
  loading: Boolean,
  error: { type: String, default: '' },
})
defineEmits(['add', 'edit', 'remove', 'retry', 'process-recurring'])
</script>

<template>
  <section class="card p-5 sm:p-6" aria-labelledby="expenses-title">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 id="expenses-title" class="font-serif text-xl font-bold">{{ title }}</h2>
      <button type="button" class="btn-ghost !py-1.5" title="Cria as cobranças recorrentes que já venceram" @click="$emit('process-recurring')">↻ Lançar recorrentes</button>
    </div>

    <p v-if="loading" class="py-10 text-center text-muted">Carregando…</p>

    <div v-else-if="error" role="alert" class="mt-4 rounded-xl bg-danger-soft p-4 text-sm text-danger">
      <p class="font-semibold">{{ error }}</p>
      <button type="button" class="btn-secondary mt-3" @click="$emit('retry')">Tentar de novo</button>
    </div>

    <div v-else-if="!expenses.length" class="py-10 text-center">
      <p class="text-muted">Nenhuma despesa neste mês.</p>
      <button type="button" class="btn-primary mt-4" @click="$emit('add')">Registrar a primeira</button>
    </div>

    <ul v-else class="mt-2 divide-y divide-line">
      <li v-for="expense in expenses" :key="expense.id" class="flex items-center justify-between gap-4 py-3.5">
        <div class="flex min-w-0 items-center gap-3.5">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft font-bold text-accent-dark" aria-hidden="true">{{ expense.category.slice(0, 1) }}</span>
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ expense.description }}</p>
            <p class="truncate text-sm text-muted">
              {{ expense.category }} · {{ expense.paymentMethod }} · {{ formatDate(expense.date) }}<template v-if="expense.recurring"> · repete {{ FREQUENCY_LABELS[expense.recurringFrequency] }}</template>
            </p>
          </div>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span class="font-bold tabular-nums">{{ formatCurrency(expense.amount) }}</span>
          <span class="flex gap-1">
            <button type="button" class="link-button" :aria-label="`Editar ${expense.description}`" @click="$emit('edit', expense)">Editar</button>
            <button type="button" class="link-button-danger" :aria-label="`Remover ${expense.description}`" @click="$emit('remove', expense)">Remover</button>
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>
