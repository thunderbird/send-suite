<script setup>
import { inject } from 'vue';
const messageSocket = inject('messageSocket');
const burn = inject('burn');
const clean = inject('clean');
const props = defineProps({
  conversationId: Number,
});

const CONFIRMATION = 'Are you sure?';

async function burnAfterReading() {
  if (confirm(CONFIRMATION)) {
    await burn(props.conversationId);
    clean(props.conversationId);

    messageSocket.value.send(
      JSON.stringify({
        type: 'burn',
        conversationId: props.conversationId,
      })
    );
  }
}
</script>

<template>
  <button type="button" class="btn-primary" @click="burnAfterReading">
    🔥
  </button>
  <!-- <button
        class="btn-primary"

    @click="burnAfterReading"
  >
    🔥🔥🔥
  </button> -->
</template>
