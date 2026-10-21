import { ref } from 'vue'

const toasts = ref([])
let nextId = 1

function dismiss(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function push(message, kind = 'success') {
  const id = nextId++
  toasts.value = [...toasts.value, { id, message, kind }]
  setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000)
}

export function useToasts() {
  return { toasts, push, dismiss }
}
