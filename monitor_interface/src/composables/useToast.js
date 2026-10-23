import { ref } from 'vue'

const toast = ref({ show: false, message: '', type: 'info' })
let toastTimer = null

export function useToast() {
  function showToast(message, type = 'info') {
    toast.value = { show: true, message, type }
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast.value.show = false
    }, 3200)
  }

  function hideToast() {
    toast.value.show = false
    clearTimeout(toastTimer)
  }

  return {
    toast,
    showToast,
    hideToast,
  }
}
