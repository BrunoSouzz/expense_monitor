import { ref } from 'vue'

const theme = ref(localStorage.getItem('expense-theme') || 'pastel')
const fontScale = ref(Number(localStorage.getItem('expense-font-scale') || 1))
const reducedMotion = ref(localStorage.getItem('expense-reduced-motion') === 'true')
const lineSpacing = ref(localStorage.getItem('expense-line-spacing') === 'true')
const largeCursor = ref(localStorage.getItem('expense-large-cursor') === 'true')
const focusHighlight = ref(localStorage.getItem('expense-focus-highlight') !== 'false')

// Initialize font scale CSS variable on document
if (typeof document !== 'undefined') {
  document.documentElement.style.setProperty('--font-scale', String(fontScale.value))
}

export function useAccessibility() {
  function applyTheme(nextTheme) {
    theme.value = nextTheme
    localStorage.setItem('expense-theme', nextTheme)
  }

  function applyFontScale(value) {
    fontScale.value = Number(value)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-scale', String(fontScale.value))
    }
    localStorage.setItem('expense-font-scale', String(value))
  }

  function toggleMotion() {
    reducedMotion.value = !reducedMotion.value
    localStorage.setItem('expense-reduced-motion', String(reducedMotion.value))
  }

  function toggleAccessibilityOption(name, value) {
    const options = { lineSpacing, largeCursor, focusHighlight }
    if (options[name]) {
      options[name].value = value
      const storageKey = {
        lineSpacing: 'expense-line-spacing',
        largeCursor: 'expense-large-cursor',
        focusHighlight: 'expense-focus-highlight',
      }[name]
      localStorage.setItem(storageKey, String(value))
    }
  }

  return {
    theme,
    fontScale,
    reducedMotion,
    lineSpacing,
    largeCursor,
    focusHighlight,
    applyTheme,
    applyFontScale,
    toggleMotion,
    toggleAccessibilityOption,
  }
}
