<script setup lang="ts">
const { errorMessage } = defineProps<{
  errorMessage: string;
}>();
</script>

<template>
  <div
    class="flex flex-col gap-2 items-center justify-center p-4 rounded-lg transition duration-500 ease-in-out text-white bg-red-400 hover:bg-red-300"
    role="status"
  >
    <p>
      {{ errorMessage }}
    </p>
  </div>
</template>
