<script setup>
import { inject } from 'vue';

const burn = inject('burn');
const props = defineProps({
  conversationId: Number,
});

const CONFIRMATION = 'Are you sure?';

async function burnAfterReading() {
  if (confirm(CONFIRMATION)) {
    burn(props.conversationId);
  }
}
</script>

<template>
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="burnAfterReading"
  >
    🔥🔥🔥
  </button>
</template>
