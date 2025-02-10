<script setup lang="ts">
import { DAYS_TO_EXPIRY, MAX_FILE_SIZE_HUMAN_READABLE } from '@/lib/const';
import { trpc } from '@/lib/trpc';
import { useQuery } from '@tanstack/vue-query';
import prettyBytes from 'pretty-bytes';
import { computed } from 'vue';
import LoadingComponent from './LoadingComponent.vue';

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

const { data: u, isLoading } = useQuery({
  queryKey: ['getUserDataDashboard'],
  queryFn: async () => {
    return await trpc.getUserData.query();
  },
});

const hasLimitedStorage = computed(() => {
  return u?.value?.userData?.tier === 'EPHEMERAL';
});
</script>
<template>
  <LoadingComponent v-if="isLoading" />
  <main v-else>
    <p v-if="error">{{ error.message }}</p>
    <p>Tier: {{ u?.userData.tier }}</p>
    <p v-if="hasLimitedStorage">
      Total storage used:
      <span class="active">{{ size?.active }} active</span> /
      <span class="expired">{{ size?.expired }} expired</span>
    </p>
    <p v-else>Total storage used: {{ size?.active }}</p>
    <p v-if="hasLimitedStorage">
      Your files expire after {{ DAYS_TO_EXPIRY }} days
    </p>
    <p>Max file size: {{ MAX_FILE_SIZE_HUMAN_READABLE }}</p>
  </main>
</template>

<style lang="css" scoped>
.expired {
  color: var(--colour-ti-critical);
}
.active {
  color: var(--colour-send-primary);
}
</style>
