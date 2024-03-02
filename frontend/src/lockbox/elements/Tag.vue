<script setup>
import { IconTag } from '@tabler/icons-vue';
import { TagColors } from '@/lockbox/const';
defineProps({
  color: String,
});
</script>
<template>
  <IconTag :class="['w-5 h-5', `${TagColors[color]}`]" />
  <slot></slot>
</template>
