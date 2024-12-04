<script setup>
import { onErrorCaptured, ref } from 'vue';
import FeedbackBox from './FeedbackBox.vue';
import Modal from './ModalComponent.vue';

const hasError = ref(false);
const error = ref(null);

onErrorCaptured((err) => {
  hasError.value = true;
  error.value = err;
  return false;
});

const reload = () => {
  hasError.value = false;
  error.value = null;
};
</script>

<template>
  <div>
    <Modal v-if="hasError" @close="reload">
      <p>An error occurred: {{ error.message }}</p>
      <FeedbackBox />
    </Modal>
    <div v-else>
      <slot />
    </div>
  </div>
</template>
