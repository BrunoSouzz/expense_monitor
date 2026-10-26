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

defineEmits(['toggle-settings', 'open-create'])
</script>

<template>
  <header class="site-header clean-header">
    <div class="header-content">
      <div class="brand-area">
        <a href="#" class="brand" aria-label="Expense Monitor">
          <img src="/expense-mark.svg" alt="Expense Monitor" class="brand-mark" width="34" height="34">
          <span class="brand-title">Expense <strong>Monitor</strong></span>
        </a>
        <span
          class="api-status-badge compact"
          :class="{ online: apiOnline, offline: !apiOnline }"
          :title="apiOnline ? 'Conectado' : 'Desconectado'"
        >
          <span class="status-dot"></span>
        </span>
      </div>

      <div class="header-actions">
        <button
          class="primary-button small"
          title="Cadastrar nova despesa"
          @click="$emit('open-create')"
        >
          + Nova Despesa
        </button>
        <button
          class="icon-button clean-icon-btn"
          title="Configurações e Acessibilidade"
          aria-label="Abrir configurações"
          @click="$emit('toggle-settings')"
        >
          ⚙
        </button>
      </div>
    </div>

    <slot name="settings" />
  </header>
</template>
