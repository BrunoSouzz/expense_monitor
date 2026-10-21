<script setup>
import { reactive, ref } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { todayISO } from '../lib/format.js'

const props = defineProps({
  income: { type: Object, default: null },
  save: { type: Function, required: true },
})
const emit = defineEmits(['close'])

const editing = Boolean(props.income)
const form = reactive({
  name: props.income?.name ?? '',
  amount: props.income ? String(props.income.amount).replace('.', ',') : '',
  date: props.income?.date ?? todayISO(),
  recurring: props.income?.recurring ?? false,
  recurringFrequency: props.income?.recurringFrequency ?? 'monthly',
})

const busy = ref(false)
const error = ref('')

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await props.save({ ...form })
    emit('close')
  } catch (failure) {
    error.value = failure.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BaseDialog :title="editing ? 'Editar entrada' : 'Nova entrada'" @close="emit('close')">
    <form class="grid gap-4" @submit.prevent="submit">
      <label class="block">
        <span class="field-label">Nome</span>
        <input v-model="form.name" class="field" required maxlength="60" placeholder="Ex.: Salário, mesada, freelance" autofocus>
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="field-label">Valor (R$)</span>
          <input v-model="form.amount" class="field" required inputmode="decimal" placeholder="0,00">
        </label>
        <label class="block">
          <span class="field-label">Data</span>
          <input v-model="form.date" class="field" required type="date">
        </label>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label class="flex items-center gap-2 text-sm font-semibold">
          <input v-model="form.recurring" type="checkbox" class="size-4 accent-[var(--accent-dark)]">
          <span>Repete</span>
        </label>
        <label v-if="form.recurring" class="flex items-center gap-2 text-sm">
          <span class="field-label">Frequência</span>
          <select v-model="form.recurringFrequency" class="field !mt-0 !w-auto">
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </label>
      </div>

      <p v-if="error" role="alert" class="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{{ error }}</p>

      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="busy">{{ editing ? 'Salvar alterações' : 'Adicionar entrada' }}</button>
      </div>
    </form>
  </BaseDialog>
</template>
