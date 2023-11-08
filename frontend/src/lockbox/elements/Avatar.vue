<script setup>
defineProps({
  title: String,
  subtitle: String,
  initials: Boolean
})
</script>

<template>
  <div
    v-if="title"
    class="w-8 h-8 rounded-full bg-gray-400 text-white flex justify-center items-center text-lg outline-2 outline-rose-900"
    :title="subtitle"
  >
    {{ title.substring(0, 1) }}
  </div>
</template>