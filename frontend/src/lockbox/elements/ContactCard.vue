<script setup>
defineProps({
  title: String,
  subtitle: String,
  initials: Boolean,
});
</script>

<template>
  <div class="rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
    <div class="flex items-center justify-between gap-4">
      <div
        v-if="initials"
        class="w-8 h-8 rounded-full bg-gray-300 text-white flex justify-center items-center text-lg"
      >
        {{ title.substring(0, 1) }}
      </div>
      <div class="text-gray-800">
        <div class="font-semibold text-sm">{{ title }}</div>
        <div class="text-xs">{{ subtitle }}</div>
      </div>
    </div>
  </div>
</template>
