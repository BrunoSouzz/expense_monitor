<script setup>
import { ref } from 'vue'
import BaseDialog from './BaseDialog.vue'

const props = defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirm: { type: Function, required: true },
})
const emit = defineEmits(['close'])

const busy = ref(false)
const error = ref('')

async function run() {
  busy.value = true
  error.value = ''
  try {
    await props.confirm()
    emit('close')
  } catch (failure) {
    error.value = failure.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BaseDialog :title="title" @close="emit('close')">
    <p class="text-muted">{{ message }}</p>
    <p v-if="error" role="alert" class="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{{ error }}</p>
    <div class="mt-6 flex justify-end gap-2">
      <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
      <button type="button" class="btn-danger" :disabled="busy" @click="run">Remover</button>
    </div>
  </BaseDialog>
</template>
