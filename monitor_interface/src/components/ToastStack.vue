<script setup>
import { useToasts } from '../composables/useToasts.js'

const { toasts, dismiss } = useToasts()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end" role="status" aria-live="polite">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex max-w-sm animate-pop-in items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-card"
      :class="toast.kind === 'error' ? 'bg-danger-soft text-danger' : 'bg-ink text-surface'"
    >
      <span>{{ toast.message }}</span>
      <button type="button" class="-mr-1 rounded px-1 opacity-70 hover:opacity-100" aria-label="Dispensar aviso" @click="dismiss(toast.id)">✕</button>
    </div>
  </div>
</template>
