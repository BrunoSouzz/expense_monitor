<script setup>
import { onMounted, ref } from 'vue'

defineProps({ title: { type: String, required: true } })
const emit = defineEmits(['close'])

const dialog = ref(null)
const titleId = `dialog-${Math.random().toString(36).slice(2, 8)}`

// <dialog> nativo: o navegador cuida do foco, do Esc e do fundo bloqueado.
onMounted(() => dialog.value?.showModal())

const closeOnBackdrop = (event) => {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="m-auto max-h-[90vh] w-[min(30rem,calc(100vw-2rem))] animate-pop-in overflow-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/40"
    @close="emit('close')"
    @click="closeOnBackdrop"
  >
    <div class="p-6">
      <header class="mb-5 flex items-start justify-between gap-4">
        <h2 :id="titleId" class="font-serif text-2xl font-bold">{{ title }}</h2>
        <button type="button" class="btn-ghost -mr-2 -mt-1 !px-2.5" aria-label="Fechar" @click="emit('close')">✕</button>
      </header>
      <slot />
    </div>
  </dialog>
</template>
