<script setup>
import Avatar from './Avatar.vue';
defineProps({
  title: String,
  subtitle: String,
  initials: Boolean,
});
</script>

<template>
  <div class="rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
    <div class="flex items-center justify-between gap-4">
      <Avatar :initials="initials" :title="title" />
      <div class="text-gray-800">
        <div class="font-semibold text-sm">{{ title }}</div>
        <div class="text-xs">{{ subtitle }}</div>
      </div>
    </div>
  </div>
</template>
