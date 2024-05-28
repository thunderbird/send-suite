<script setup lang="ts">
import { IconTag } from '@tabler/icons-vue';
import { TagColors } from '@/apps/lockbox/const';
defineProps({
  color: String,
});
</script>
<template>
  <IconTag :class="['w-5 h-5', `${TagColors[color]}`]" />
  <slot></slot>
</template>
