<script setup>
defineProps({
  apiOnline: {
    type: Boolean,
    default: true,
  },
  showSettings: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle-settings', 'process-recurring', 'open-create'])
</script>

<template>
  <header class="site-header">
    <div class="header-content">
      <div class="brand-area">
        <a href="#" class="brand" aria-label="Expense Monitor - Início" data-guide="Logo do Expense Monitor. Sistema de simulação financeira.">
          <img src="/expense-mark.svg" alt="Expense Monitor" class="brand-mark" width="40" height="40">
          <div>
            <span class="brand-title">Expense <strong>Monitor</strong></span>
            <span class="brand-tagline">Simulador & Controle de Saldo</span>
          </div>
        </a>
        <span class="api-status-badge" :class="{ online: apiOnline, offline: !apiOnline }" :title="apiOnline ? 'API conectada' : 'API desconectada'">
          <span class="status-dot"></span>
          <span class="hide-mobile">{{ apiOnline ? 'Online' : 'Offline' }}</span>
        </span>
      </div>

      <div class="header-actions">
        <button
          class="icon-button hint"
          data-tooltip="Temas, contraste, leitura e acessibilidade."
          aria-label="Abrir preferências de acessibilidade"
          @click="$emit('toggle-settings')"
        >
          ⚙ <span class="hide-mobile">Acessibilidade</span>
        </button>
        <button
          class="secondary-button small hint"
          data-tooltip="Processa lançamentos recorrentes já vencidos."
          @click="$emit('process-recurring')"
        >
          ↻ Recorrentes
        </button>
        <button
          class="primary-button small hint"
          data-tooltip="Registrar um novo gasto para o período."
          @click="$emit('open-create')"
        >
          + Nova Despesa
        </button>
      </div>
    </div>

    <slot name="settings" />
  </header>
</template>
