<script setup lang="ts">
import { provide } from 'vue';
import Home from '@/apps/lockbox/views/Home.vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { DayJsKey } from '@/types';

dayjs.extend(relativeTime);
provide(DayJsKey, dayjs);
</script>

<template>
  <Home />
</template>
