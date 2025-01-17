<script setup lang="ts">
import { DAYS_TO_EXPIRY, MAX_FILE_SIZE_HUMAN_READABLE } from '@/lib/const';
import { trpc } from '@/lib/trpc';
import { useQuery } from '@tanstack/vue-query';
import prettyBytes from 'pretty-bytes';

const { data: size, error } = useQuery({
  queryKey: ['getTotalSize'],
  queryFn: async () => {
    const { active, expired } = await trpc.getTotalUsedStorage.query();

    return {
      active: prettyBytes(active),
      expired: prettyBytes(expired),
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
  <p>Tier: {{ userData?.userData.tier }}</p>
  <p>
    Total storage used: <span class="active">{{ size?.active }} active</span> /
    <span class="expired">{{ size?.expired }} expired</span>
  </p>
  <p>Your files expire after {{ DAYS_TO_EXPIRY }} days</p>
  <p>Max file size: {{ MAX_FILE_SIZE_HUMAN_READABLE }}</p>
</template>

<style lang="css" scoped>
.expired {
  color: var(--colour-ti-critical);
}
.active {
  color: var(--colour-send-primary);
}
</style>
