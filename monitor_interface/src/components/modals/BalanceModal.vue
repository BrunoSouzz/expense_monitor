<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  initialBalance: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close', 'save'])

const balanceInput = ref(props.initialBalance)

watch(
  () => [props.show, props.initialBalance],
  ([show, balance]) => {
    if (show) {
      balanceInput.value = balance
    }
  },
  { immediate: true }
)

function handleSubmit() {
  emit('save', Number(balanceInput.value))
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <form class="expense-form balance-form" @submit.prevent="handleSubmit">
      <button type="button" class="close-button" aria-label="Fechar" @click="$emit('close')">×</button>
      <p class="eyebrow">Configuração de Caixa</p>
      <h2>Saldo Disponível em Conta</h2>
      <p class="modal-lead">
        Quanto dinheiro você tem na conta agora para iniciar seu planejamento financeiro?
      </p>

      <label>
        Valor em Conta (R$)
        <input
          v-model="balanceInput"
          required
          min="0"
          step="0.01"
          type="number"
          placeholder="Ex: 3500,00"
          class="large-input"
        >
      </label>

      <p class="form-help">
        💡 Esse valor não precisa ser dinheiro real e não conecta com nenhum banco. É apenas para você simular e acompanhar a diferença dos gastos.
      </p>

      <button class="primary-button submit-btn" type="submit">Salvar Saldo em Conta</button>
    </form>
  </div>
</template>
