<script setup>
import { formatCurrency } from '../lib/format.js'

// `items` vem de summary.spent.byCategory: [{ category, total, percentage }], do maior para o menor.
defineProps({ items: { type: Array, required: true }, monthName: { type: String, required: true } })

const colors = ['bg-accent-dark', 'bg-accent', 'bg-support', 'bg-success', 'bg-support-dark', 'bg-success-dark']
</script>

<template>
  <section class="card p-5" aria-labelledby="categories-title">
    <h2 id="categories-title" class="font-serif text-lg font-bold">Onde foi o dinheiro</h2>

    <ul v-if="items.length" class="mt-4 grid gap-3.5">
      <li v-for="(item, index) in items" :key="item.category">
        <div class="flex items-baseline justify-between gap-3 text-sm">
          <span class="font-semibold">{{ item.category }}</span>
          <span class="tabular-nums text-muted">{{ formatCurrency(item.total) }} · {{ item.percentage }}%</span>
        </div>
        <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-soft" role="img" :aria-label="`${item.category}: ${item.percentage}% dos gastos de ${monthName}`">
          <div class="h-full rounded-full" :class="colors[index % colors.length]" :style="{ width: `${Math.max(item.percentage, 2)}%` }" />
        </div>
      </li>
    </ul>
    <p v-else class="mt-3 text-sm text-muted">As categorias aparecem aqui assim que você registrar uma despesa em {{ monthName }}.</p>
  </section>
</template>
