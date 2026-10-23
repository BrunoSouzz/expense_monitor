import { ref, onUnmounted } from 'vue'

export function useVoiceAssistant({ onCommand } = {}) {
  const voiceEnabled = ref(localStorage.getItem('expense-voice-assistant') === 'true')
  const isListening = ref(false)
  const voiceStatus = ref('')
  let speechRecognition = null
  let guideTarget = null
  let guideTimer = null

  function speak(text) {
    if (!voiceEnabled.value || !('speechSynthesis' in window)) {
      voiceStatus.value = 'A leitura por voz está desativada ou não é suportada neste navegador.'
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.95
    utterance.onstart = () => { voiceStatus.value = 'Lendo informações em voz alta.' }
    utterance.onend = () => { voiceStatus.value = 'Leitura concluída.' }
    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    voiceStatus.value = 'Leitura interrompida.'
  }

  function toggleVoiceAssistant() {
    voiceEnabled.value = !voiceEnabled.value
    localStorage.setItem('expense-voice-assistant', String(voiceEnabled.value))
    if (!voiceEnabled.value) {
      stopListening()
      stopSpeaking()
      return
    }
    speak('Assistente de voz ativado. Você pode pedir o resumo financeiro ou dizer nova despesa.')
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      voiceStatus.value = 'Comandos por voz não são suportados neste navegador. Use o Chrome ou Edge.'
      return
    }
    if (isListening.value) return
    speechRecognition = new Recognition()
    speechRecognition.lang = 'pt-BR'
    speechRecognition.continuous = false
    speechRecognition.interimResults = false
    speechRecognition.onstart = () => {
      isListening.value = true
      voiceStatus.value = 'Ouvindo um comando...'
    }
    speechRecognition.onresult = (event) => {
      const command = event.results?.[0]?.[0]?.transcript || ''
      if (onCommand) {
        onCommand(command)
      }
    }
    speechRecognition.onerror = () => {
      voiceStatus.value = 'Não foi possível entender o comando. Tente novamente.'
    }
    speechRecognition.onend = () => {
      isListening.value = false
    }
    speechRecognition.start()
  }

  function stopListening() {
    if (speechRecognition) speechRecognition.stop()
    isListening.value = false
  }

  function getFieldLabel(field) {
    const label = field.closest('label')
    if (!label) return ''
    const labelText = Array.from(label.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(' ')
    return labelText || label.textContent.trim().replace(/\s+/g, ' ')
  }

  function describeGuideTarget(target) {
    const tagName = target.tagName.toLowerCase()
    if (['input', 'select', 'textarea'].includes(tagName)) {
      const label = getFieldLabel(target) || target.getAttribute('aria-label') || 'Campo'
      const type = target.type === 'number'
        ? 'numérico'
        : target.type === 'date'
          ? 'de data'
          : tagName === 'select'
            ? 'de seleção'
            : 'de texto'
      const value = target.value ? ` Valor atual: ${target.value}.` : target.placeholder ? ` Exemplo: ${target.placeholder}.` : ''
      const options = tagName === 'select'
        ? ` Opções disponíveis: ${Array.from(target.options).map((option) => option.text).join(', ')}.`
        : ''
      return `${label}. Campo ${type}.${value}${options}`
    }
    return target.dataset.guide
      || target.getAttribute('aria-label')
      || target.dataset.tooltip
      || target.textContent.trim().replace(/\s+/g, ' ').slice(0, 120)
  }

  function handleGuideInteraction(event) {
    if (!voiceEnabled.value) return
    const target = event.target.closest('[data-guide], button, input, select, textarea, a, article, section')
    if (!target || !event.currentTarget.contains(target)) return
    const message = describeGuideTarget(target)
    if (!message || target === guideTarget) return
    guideTarget = target
    clearTimeout(guideTimer)
    guideTimer = setTimeout(() => speak(message), 650)
  }

  function hideGuide() {
    guideTarget = null
    clearTimeout(guideTimer)
  }

  onUnmounted(() => {
    stopListening()
    stopSpeaking()
    clearTimeout(guideTimer)
  })

  return {
    voiceEnabled,
    isListening,
    voiceStatus,
    speak,
    stopSpeaking,
    toggleVoiceAssistant,
    startListening,
    stopListening,
    handleGuideInteraction,
    hideGuide,
  }
}
