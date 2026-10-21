<script setup>
import BaseDialog from './BaseDialog.vue'

// `prefs` vem de usePreferences() (reativo); `voice` vem de useVoice().
defineProps({ prefs: { type: Object, required: true }, voice: { type: Object, required: true } })
const emit = defineEmits(['close'])

const themes = [
  { id: 'pastel', label: 'Pastel' },
  { id: 'twilight', label: 'Crepúsculo' },
  { id: 'contrast', label: 'Contraste' },
]
const toggles = [
  { key: 'lineSpacing', label: 'Espaçamento maior entre linhas' },
  { key: 'largeCursor', label: 'Cursor ampliado' },
  { key: 'focusHighlight', label: 'Destaque de foco no teclado' },
  { key: 'reducedMotion', label: 'Reduzir animações' },
]
</script>

<template>
  <BaseDialog title="Preferências" @close="emit('close')">
    <div class="grid gap-6">
      <fieldset>
        <legend class="field-label">Tema</legend>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="theme in themes"
            :key="theme.id"
            type="button"
            class="chip !px-4 !py-1.5 !text-sm"
            :aria-pressed="prefs.theme === theme.id"
            @click="prefs.theme = theme.id"
          >{{ theme.label }}</button>
        </div>
      </fieldset>

      <label class="block">
        <span class="field-label">Tamanho do texto</span>
        <input v-model.number="prefs.fontScale" type="range" min="0.9" max="1.3" step="0.05" class="mt-2 w-full accent-[var(--accent-dark)]">
      </label>

      <div class="grid gap-3">
        <label v-for="item in toggles" :key="item.key" class="flex items-center justify-between gap-4 text-sm font-semibold">
          <span>{{ item.label }}</span>
          <input v-model="prefs[item.key]" type="checkbox" class="size-4 accent-[var(--accent-dark)]">
        </label>
      </div>

      <section class="grid gap-3 border-t border-line pt-5">
        <label class="flex items-center justify-between gap-4 text-sm font-semibold">
          <span>Assistente de voz <span class="block font-normal text-muted">Lê o resumo, descreve o que está sob o cursor e aceita comandos.</span></span>
          <input v-model="prefs.voiceEnabled" type="checkbox" class="size-4 shrink-0 accent-[var(--accent-dark)]">
        </label>
        <div v-if="prefs.voiceEnabled" class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="voice.speakSummary">Ler resumo</button>
          <button type="button" class="btn-secondary" @click="voice.listening.value ? voice.stopListening() : voice.startListening()">
            {{ voice.listening.value ? 'Parar de ouvir' : 'Dizer um comando' }}
          </button>
          <button type="button" class="btn-ghost" @click="voice.stopSpeaking">Parar leitura</button>
        </div>
        <p v-if="voice.status.value" class="text-sm text-muted" aria-live="polite">{{ voice.status.value }}</p>
      </section>
    </div>
  </BaseDialog>
</template>
