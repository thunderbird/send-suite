<script setup lang="ts">
defineProps({
  selected: Boolean,
});
</script>

<template>
  <td
    class="px-4 py-2 border-y border-transparent group-hover:bg-gray-50 group-hover:border-gray-300 first:rounded-l-md first:border-l last:rounded-r-md last:border-r transition-colors"
    :class="{ '!bg-sky-50 !border-sky-500': selected }"
    data-testid="folder-table-row-cell"
  >
    <slot></slot>
  </td>
</template>

<style scoped>
td {
  user-select: none;
}
</style>
