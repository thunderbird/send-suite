<script setup lang="ts">
import { TagLabelColors } from '@/apps/lockbox/const';
defineProps({
  color: String,
});
</script>
<template>
  <div :class="['px-1.5 py-0.5 rounded bg-gray-500 text-white text-xs font-semibold', `${TagLabelColors[color]}`]">
    <slot></slot>
  </div>
</template>
