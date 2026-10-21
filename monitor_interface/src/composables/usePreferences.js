import { ref, watch, watchEffect } from 'vue'

// Mesmas chaves das versões anteriores: quem já personalizou o app não perde as escolhas.
const KEYS = {
  theme: 'expense-theme',
  fontScale: 'expense-font-scale',
  reducedMotion: 'expense-reduced-motion',
  lineSpacing: 'expense-line-spacing',
  largeCursor: 'expense-large-cursor',
  focusHighlight: 'expense-focus-highlight',
  voiceEnabled: 'expense-voice-assistant',
  chartType: 'expense-chart-type',
}

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Armazenamento indisponível: a preferência vale só para esta sessão.
  }
}

const readBool = (key, fallback) => {
  const value = read(key, null)
  return value === null ? fallback : value === 'true'
}

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const state = {
  theme: ref(read(KEYS.theme, 'pastel')),
  fontScale: ref(Number(read(KEYS.fontScale, 1)) || 1),
  reducedMotion: ref(readBool(KEYS.reducedMotion, prefersReducedMotion)),
  lineSpacing: ref(readBool(KEYS.lineSpacing, false)),
  largeCursor: ref(readBool(KEYS.largeCursor, false)),
  focusHighlight: ref(readBool(KEYS.focusHighlight, true)),
  voiceEnabled: ref(readBool(KEYS.voiceEnabled, false)),
  chartType: ref(read(KEYS.chartType, 'bars')),
}

// Estado único e compartilhado: persiste cada preferência e aplica o resultado em <html>.
for (const [name, key] of Object.entries(KEYS)) watch(state[name], (value) => write(key, value))

watchEffect(() => {
  const root = document.documentElement
  root.dataset.theme = state.theme.value
  root.style.setProperty('--font-scale', String(state.fontScale.value))
  root.classList.toggle('reduce-motion', state.reducedMotion.value)
  root.classList.toggle('wide-spacing', state.lineSpacing.value)
  root.classList.toggle('large-cursor', state.largeCursor.value)
  root.classList.toggle('focus-highlight', state.focusHighlight.value)
})

export const usePreferences = () => state
