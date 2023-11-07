<script setup>
defineProps({
  selected: Boolean,
});
</script>

<template>
  <td
    class="
      px-4 py-2 border-y border-transparent group-hover:bg-gray-50 group-hover:border-gray-300
      first:rounded-l-md first:border-l last:rounded-r-md last:border-r
    "
    :class="{ '!bg-sky-50 !border-sky-500': selected }"
  >
    <slot></slot>
</td>
</template>
