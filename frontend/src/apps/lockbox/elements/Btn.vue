<script setup lang="ts">
defineProps({
  primary: Boolean,
  secondary: Boolean,
  danger: Boolean,
});
</script>

<template>
  <button
    class="px-3 py-2 font-semibold text-sm whitespace-nowrap border rounded hover:shadow-md transition-all flex items-center justify-center gap-2"
    :class="{
      'text-gray-700 border-gray-100 bg-gray-100':
        !secondary && !primary && !danger,
      'text-white border-blue-800 bg-blue-600': primary,
      'text-gray-800 border-gray-400 bg-gray-200': secondary,
      'text-white border-red-800 bg-red-600': danger,
    }"
  >
    <slot></slot>
  </button>
</template>
