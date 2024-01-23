<script setup>
import { provide } from 'vue';
import Core from '@/lockbox/Core.vue';
import Home from '@/lockbox/views/Home.vue';
import Debug from '@/Debug.vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
provide('dayjs', dayjs);
</script>

<template>
  <Debug />
  <Home />
</template>
