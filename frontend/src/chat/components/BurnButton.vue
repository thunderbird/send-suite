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
  <button
    type="button"
    class="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
    @click="burnAfterReading"
  >
    🔥
  </button>
  <!-- <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="burnAfterReading"
  >
    🔥🔥🔥
  </button> -->
</template>
