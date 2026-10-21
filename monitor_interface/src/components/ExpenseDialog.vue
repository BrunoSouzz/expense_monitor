<script setup>
import { reactive, ref } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { CATEGORIES, PAYMENT_METHODS, todayISO } from '../lib/format.js'

// `save` recebe os dados e deve rejeitar com Error(mensagem) se a API recusar.
const props = defineProps({
  expense: { type: Object, default: null },
  save: { type: Function, required: true },
})
const emit = defineEmits(['close'])

const editing = Boolean(props.expense)
const form = reactive({
  description: props.expense?.description ?? '',
  amount: props.expense ? String(props.expense.amount).replace('.', ',') : '',
  category: props.expense?.category ?? CATEGORIES[0],
  paymentMethod: props.expense?.paymentMethod ?? PAYMENT_METHODS[0],
  date: props.expense?.date ?? todayISO(),
  notes: props.expense?.notes ?? '',
  recurring: props.expense?.recurring ?? false,
  recurringFrequency: props.expense?.recurringFrequency ?? 'monthly',
})

// Mantém categorias/formas de pagamento antigas editáveis mesmo se saíram da lista padrão.
const withCurrent = (list, current) => (list.includes(current) ? list : [current, ...list])
const categories = withCurrent(CATEGORIES, form.category)
const paymentMethods = withCurrent(PAYMENT_METHODS, form.paymentMethod)

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
  <BaseDialog :title="editing ? 'Editar despesa' : 'Nova despesa'" @close="emit('close')">
    <form class="grid gap-4" @submit.prevent="submit">
      <label class="block">
        <span class="field-label">Descrição</span>
        <input v-model="form.description" class="field" required maxlength="120" placeholder="Ex.: Mercado" autofocus>
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

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="field-label">Categoria</span>
          <select v-model="form.category" class="field">
            <option v-for="item in categories" :key="item">{{ item }}</option>
          </select>
        </label>
        <label class="block">
          <span class="field-label">Pagamento</span>
          <select v-model="form.paymentMethod" class="field">
            <option v-for="item in paymentMethods" :key="item">{{ item }}</option>
          </select>
        </label>
      </div>

      <label class="block">
        <span class="field-label">Observações (opcional)</span>
        <textarea v-model="form.notes" class="field resize-none" maxlength="240" rows="2" />
      </label>

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
      <p v-if="form.recurring" class="-mt-2 text-xs text-muted">
        Nada é lançado sozinho: use “Lançar recorrentes” na lista para criar as cobranças vencidas.
      </p>

      <p v-if="error" role="alert" class="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{{ error }}</p>

      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="busy">{{ editing ? 'Salvar alterações' : 'Adicionar despesa' }}</button>
      </div>
    </form>
  </BaseDialog>
</template>
