<script setup lang="ts">
import { useStatusStore } from '../stores/status-store';

const { progress } = useStatusStore();
</script>

<template>
  <div
    class="flex flex-col gap-2 items-center justify-center p-4 rounded-lg transition duration-500 ease-in-out text-white bg-red-400 hover:bg-red-300"
    role="status"
  >
    <p>
      {{
        progress.error ||
        `There was an error uploading your file, please try again or raise an issue`
      }}
    </p>
  </div>
</template>
