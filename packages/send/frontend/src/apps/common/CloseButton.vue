<script setup lang="ts">
import CloseIcon from './CloseIcon.vue';

// set props
const { close } = defineProps<{ close: () => void }>();
</script>

<template>
  <button data-testid="close-button" class="closebutton" :onclick="close">
    <CloseIcon />
  </button>
</template>
