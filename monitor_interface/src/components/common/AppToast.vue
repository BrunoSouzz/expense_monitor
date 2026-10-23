<script setup>
defineProps({
  toast: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <transition name="toast-fade">
    <div v-if="toast.show" class="app-toast" :class="`toast-${toast.type}`" role="status" aria-live="polite">
      <span class="toast-indicator"></span>
      <span>{{ toast.message }}</span>
    </div>
  </transition>
</template>
