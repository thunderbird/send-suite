<script setup>
import { provide } from 'vue';
import Home from '@/apps/lockbox/views/Home.vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
provide('dayjs', dayjs);
</script>

<template>
  <Home />
</template>
