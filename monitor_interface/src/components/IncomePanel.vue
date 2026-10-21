<script setup>
import { FREQUENCY_LABELS, formatCurrency } from '../lib/format.js'

defineProps({ income: { type: Array, required: true } })
defineEmits(['add', 'edit', 'remove'])
</script>

<template>
  <section class="card p-5" aria-labelledby="income-title">
    <div class="flex items-center justify-between gap-3">
      <h2 id="income-title" class="font-serif text-lg font-bold">Entradas</h2>
      <button type="button" class="btn-secondary !px-3 !py-1.5" @click="$emit('add')">+ Adicionar</button>
    </div>

    <ul v-if="income.length" class="mt-3 divide-y divide-line">
      <li v-for="item in income" :key="item.id" class="flex items-center justify-between gap-3 py-2.5">
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">{{ item.name }}</p>
          <p v-if="item.recurring" class="text-xs text-muted">Repete {{ FREQUENCY_LABELS[item.recurringFrequency] }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <span class="mr-1 text-sm font-bold tabular-nums text-success-dark">{{ formatCurrency(item.amount) }}</span>
          <button type="button" class="link-button" :aria-label="`Editar ${item.name}`" @click="$emit('edit', item)">Editar</button>
          <button type="button" class="link-button-danger" :aria-label="`Remover ${item.name}`" @click="$emit('remove', item)">Remover</button>
        </div>
      </li>
    </ul>
    <p v-else class="mt-3 text-sm text-muted">Adicione seu salário, mesada ou outra entrada para ver o saldo.</p>
  </section>
</template>
