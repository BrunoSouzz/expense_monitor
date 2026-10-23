<script setup>
defineProps({
  item: {
    type: Object,
    default: null,
  },
})

defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div v-if="item" class="modal-backdrop" role="presentation" @click.self="$emit('cancel')">
    <section class="confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
      <div class="confirmation-icon">!</div>
      <p class="eyebrow">Confirmação</p>
      <h2 id="delete-title">Remover este item?</h2>
      <p id="delete-description">
        Você está prestes a remover <strong>“{{ item.name || item.description }}”</strong>. Essa ação não poderá ser desfeita.
      </p>
      <div class="confirmation-actions">
        <button class="secondary-button" type="button" @click="$emit('cancel')">Cancelar</button>
        <button class="danger-button" type="button" @click="$emit('confirm')">Sim, remover</button>
      </div>
    </section>
  </div>
</template>
