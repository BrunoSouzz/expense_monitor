<script setup>
import { ref, watch } from 'vue'
import { createDefaultIncome } from '../../models/types'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  editingIncome: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'save'])

const form = ref(createDefaultIncome())

watch(
  () => [props.show, props.editingIncome],
  ([show, editing]) => {
    if (show) {
      if (editing) {
        form.value = { ...editing, amount: Number(editing.amount) }
      } else {
        form.value = createDefaultIncome()
      }
    }
  },
  { immediate: true }
)

function handleSubmit() {
  emit('save', {
    ...form.value,
    name: form.value.name.trim(),
    amount: Number(form.value.amount),
    id: props.editingIncome?.id,
  })
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <form class="expense-form income-form" @submit.prevent="handleSubmit">
      <button type="button" class="close-button" aria-label="Fechar" @click="$emit('close')">×</button>
      <p class="eyebrow">{{ editingIncome ? 'Ajustar Entrada' : 'Nova Entrada' }}</p>
      <h2>{{ editingIncome ? 'Editar Entrada Financeira' : 'Adicionar ao Saldo' }}</h2>

      <label>
        Nome da fonte ou entrada
        <input
          v-model="form.name"
          required
          maxlength="60"
          placeholder="Ex.: Salário, Mesada, Freelance, Rendimentos"
        >
      </label>

      <label>
        Valor a receber ou somar (R$)
        <input
          v-model="form.amount"
          required
          min="0.01"
          step="0.01"
          type="number"
          placeholder="0,00"
        >
      </label>

      <label class="checkbox-label">
        <input v-model="form.recurring" type="checkbox">
        Entrada recorrente mensal
      </label>

      <button class="primary-button submit-btn" type="submit">
        {{ editingIncome ? 'Atualizar Entrada' : 'Adicionar Entrada' }}
      </button>
    </form>
  </div>
</template>
