<script setup>
defineProps({
  theme: {
    type: String,
    required: true,
  },
  fontScale: {
    type: Number,
    required: true,
  },
  lineSpacing: {
    type: Boolean,
    required: true,
  },
  largeCursor: {
    type: Boolean,
    required: true,
  },
  focusHighlight: {
    type: Boolean,
    required: true,
  },
  reducedMotion: {
    type: Boolean,
    required: true,
  },
  voiceEnabled: {
    type: Boolean,
    required: true,
  },
  voiceStatus: {
    type: String,
    default: '',
  },
  isListening: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'close',
  'apply-theme',
  'apply-font-scale',
  'toggle-option',
  'toggle-motion',
  'toggle-voice',
  'speak-summary',
  'toggle-listening',
  'stop-speaking',
  'export-backup',
  'restore-backup',
])
</script>

<template>
  <div class="settings-panel" aria-label="Preferências de acessibilidade">
    <div class="settings-header">
      <h3 class="setting-title">Preferências Visuais & Acessibilidade</h3>
      <button class="close-small-btn" aria-label="Fechar painel" @click="$emit('close')">×</button>
    </div>

    <div>
      <p class="setting-subtitle">Tema de Cores</p>
      <div class="theme-options" role="group" aria-label="Tema">
        <button :class="{ selected: theme === 'pastel' }" @click="$emit('apply-theme', 'pastel')">Pastel Cozy</button>
        <button :class="{ selected: theme === 'twilight' }" @click="$emit('apply-theme', 'twilight')">Crepúsculo</button>
        <button :class="{ selected: theme === 'contrast' }" @click="$emit('apply-theme', 'contrast')">Alto Contraste</button>
      </div>
    </div>

    <label class="setting-row">
      <span>Tamanho do texto</span>
      <input
        type="range"
        min="0.9"
        max="1.25"
        step="0.05"
        :value="fontScale"
        aria-label="Tamanho do texto"
        @input="$emit('apply-font-scale', $event.target.value)"
      >
    </label>

    <label class="setting-row setting-toggle">
      <span>Espaçamento ampliado entre linhas</span>
      <input
        type="checkbox"
        :checked="lineSpacing"
        aria-label="Ativar espaçamento entre linhas"
        @change="$emit('toggle-option', 'lineSpacing', $event.target.checked)"
      >
    </label>

    <label class="setting-row setting-toggle">
      <span>Cursor ampliado</span>
      <input
        type="checkbox"
        :checked="largeCursor"
        aria-label="Ativar cursor ampliado"
        @change="$emit('toggle-option', 'largeCursor', $event.target.checked)"
      >
    </label>

    <label class="setting-row setting-toggle">
      <span>Destaque de foco no teclado</span>
      <input
        type="checkbox"
        :checked="focusHighlight"
        aria-label="Ativar destaque de foco"
        @change="$emit('toggle-option', 'focusHighlight', $event.target.checked)"
      >
    </label>

    <label class="setting-row setting-toggle">
      <span>Reduzir animações de transição</span>
      <input
        type="checkbox"
        :checked="reducedMotion"
        aria-label="Reduzir animações"
        @change="$emit('toggle-motion')"
      >
    </label>

    <div class="voice-settings">
      <p class="setting-subtitle">Assistente de Voz & Leitura</p>
      <label class="setting-row setting-toggle">
        <span>Ativar leitor guiado por voz</span>
        <input
          type="checkbox"
          :checked="voiceEnabled"
          aria-label="Ativar assistente de voz"
          @change="$emit('toggle-voice')"
        >
      </label>
      <div v-if="voiceEnabled" class="voice-actions">
        <button class="text-button" @click="$emit('speak-summary')">Ouvir Resumo</button>
        <button class="text-button" @click="$emit('toggle-listening')">
          {{ isListening ? 'Parar Escuta' : 'Comando por Voz' }}
        </button>
        <button class="text-button" @click="$emit('stop-speaking')">Silenciar</button>
      </div>
      <p v-if="voiceStatus" class="form-help" aria-live="polite">{{ voiceStatus }}</p>
    </div>

    <div class="backup-actions">
      <p class="setting-subtitle">Dados & Backup</p>
      <div class="backup-buttons">
        <button class="secondary-button extra-small" @click="$emit('export-backup')">Baixar Backup (JSON)</button>
        <label class="secondary-button extra-small file-upload-btn">
          Restaurar Backup
          <input type="file" accept=".json" class="hidden-input" @change="$emit('restore-backup', $event)">
        </label>
      </div>
    </div>
  </div>
</template>
