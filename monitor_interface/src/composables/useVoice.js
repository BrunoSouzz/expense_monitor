import { onUnmounted, ref, watch } from 'vue'

const OFFLINE_ERRORS = ['network', 'service-not-allowed', 'not-allowed']

function getFieldLabel(field) {
  const label = field.closest('label')
  if (!label) return ''
  const named = label.querySelector('.field-label')
  if (named) return named.textContent.trim()
  const own = Array.from(label.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent.trim())
    .filter(Boolean)
    .join(' ')
  return own || label.textContent.trim().replace(/\s+/g, ' ')
}

function describeTarget(target) {
  const tag = target.tagName.toLowerCase()
  if (['input', 'select', 'textarea'].includes(tag)) {
    const label = getFieldLabel(target) || target.getAttribute('aria-label') || 'Campo'
    const kind = { number: 'numérico', date: 'de data', checkbox: 'de marcação', range: 'deslizante' }[target.type]
      || (tag === 'select' ? 'de seleção' : 'de texto')
    const value = target.type === 'checkbox'
      ? ` ${target.checked ? 'Marcado' : 'Desmarcado'}.`
      : target.value ? ` Valor atual: ${target.value}.` : target.placeholder ? ` Exemplo: ${target.placeholder}.` : ''
    const options = tag === 'select'
      ? ` Opções disponíveis: ${Array.from(target.options).map((option) => option.text).join(', ')}.`
      : ''
    return `${label}. Campo ${kind}.${value}${options}`
  }
  return target.dataset.guide
    || target.getAttribute('aria-label')
    || target.dataset.tooltip
    || target.textContent.trim().replace(/\s+/g, ' ').slice(0, 120)
}

/**
 * Assistente de voz opcional: leitura do resumo, comandos falados e guia por voz
 * (descreve o elemento sob o cursor ou em foco).
 */
export function useVoice({ enabled, summaryText, onNewExpense, onPreferences }) {
  const listening = ref(false)
  const status = ref('')
  let recognition = null
  let guideTarget = null
  let guideTimer = null

  function speak(text) {
    if (!enabled.value || !('speechSynthesis' in window)) {
      status.value = 'A leitura por voz está desativada ou não é suportada neste navegador.'
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.95
    utterance.onstart = () => { status.value = 'Lendo informações em voz alta.' }
    utterance.onend = () => { status.value = 'Leitura concluída.' }
    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    status.value = 'Leitura interrompida.'
  }

  const speakSummary = () => speak(summaryText())

  function handleCommand(command) {
    const text = command.toLowerCase()
    if (text.includes('parar') || text.includes('silêncio')) return stopSpeaking()
    if (text.includes('resumo') || text.includes('saldo')) return speakSummary()
    if (text.includes('nova despesa') || text.includes('adicionar despesa')) {
      onNewExpense()
      return speak('Formulário de nova despesa aberto.')
    }
    if (text.includes('preferência') || text.includes('acessibilidade')) {
      onPreferences()
      return speak('Preferências abertas.')
    }
    return speak('Comando não reconhecido. Tente dizer resumo financeiro, nova despesa ou preferências.')
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      status.value = 'Comandos por voz não são suportados aqui. Use o Chrome ou o Edge.'
      return
    }
    if (listening.value) return
    recognition = new Recognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => { listening.value = true; status.value = 'Ouvindo um comando.' }
    recognition.onresult = (event) => handleCommand(event.results[0][0].transcript)
    recognition.onerror = (event) => {
      status.value = OFFLINE_ERRORS.includes(event.error)
        ? 'O reconhecimento de voz não está disponível neste ambiente. A leitura em voz alta continua funcionando.'
        : 'Não foi possível entender o comando. Tente novamente.'
    }
    recognition.onend = () => { listening.value = false }
    recognition.start()
  }

  function stopListening() {
    recognition?.stop()
    listening.value = false
  }

  function onGuideOver(event) {
    if (!enabled.value) return
    const target = event.target.closest?.('[data-guide], button, input, select, textarea, a, article, section')
    if (!target || !event.currentTarget.contains(target)) return
    const message = describeTarget(target)
    if (!message || target === guideTarget) return
    guideTarget = target
    clearTimeout(guideTimer)
    guideTimer = setTimeout(() => speak(message), 650)
  }

  function onGuideLeave() {
    guideTarget = null
    clearTimeout(guideTimer)
  }

  watch(enabled, (isOn) => {
    if (isOn) {
      speak('Assistente de voz ativado. Você pode pedir o resumo financeiro ou dizer nova despesa.')
    } else {
      stopListening()
      stopSpeaking()
      status.value = ''
    }
  })

  onUnmounted(() => {
    stopListening()
    clearTimeout(guideTimer)
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  })

  return { listening, status, speakSummary, stopSpeaking, startListening, stopListening, onGuideOver, onGuideLeave }
}
