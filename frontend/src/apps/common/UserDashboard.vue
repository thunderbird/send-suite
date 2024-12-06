<script setup lang="tsx">
import { MAX_FILE_SIZE_HUMAN_READABLE } from '@/lib/const';
import prettyBytes from 'pretty-bytes';
import { trpc } from './trpc';

import { useQuery } from '@tanstack/vue-query';

const { data: size, error } = useQuery({
  queryKey: ['getTotalSize'],
  queryFn: async () => {
    const totalSize = await trpc.getTotalUsedStorage.query();

    return {
      totalSize: prettyBytes(totalSize),
    };
  },
});

const { data: userData } = useQuery({
  queryKey: ['getUserDataDashboard'],
  queryFn: async () => {
    return await trpc.getUserData.query({ name: 'Baggins' });
  },
});
</script>
<template>
  <p v-if="error">{{ error.message }}</p>
  <p>Hello, {{ userData?.name }}</p>
  <p>Tier: {{ userData?.userData.tier }}</p>
  <p>You have {{ size?.totalSize }} in storage</p>
  <p>Max file size: {{ MAX_FILE_SIZE_HUMAN_READABLE }}</p>
</template>
