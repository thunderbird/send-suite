<script setup lang="ts">
import LogOutButton from '@/apps/send/elements/LogOutButton.vue';
import { DAYS_TO_EXPIRY } from '@/lib/const';
import { trpc } from '@/lib/trpc';
import useUserStore from '@/stores/user-store';
import { useQuery } from '@tanstack/vue-query';
import prettyBytes from 'pretty-bytes';
import { computed } from 'vue';
import ProgressBarDashboard from '../send/components/ProgressBarDashboard.vue';
import { useConfigStore } from '../send/stores/config-store';
import { useStatusStore } from '../send/stores/status-store';
import LoadingComponent from './LoadingComponent.vue';

const { logOut } = defineProps<{ logOut: () => void }>();

const { user } = useUserStore();
const { isExtension } = useConfigStore();
const { validators } = useStatusStore();

const handleLogout = async () => {
  logOut();
  await validators();
  if (!isExtension) {
    location.reload();
  }
};

const {
  data: size,
  error,
  isLoading: loadingSize,
} = useQuery({
  queryKey: ['getTotalSize'],
  queryFn: async () => {
    return trpc.getTotalUsedStorage.query();
  },
});

const { data: u, isLoading: loadingDashboard } = useQuery({
  queryKey: ['getUserDataDashboard'],
  queryFn: async () => {
    return await trpc.getUserData.query();
  },
});

const isLoading = computed(() => {
  return loadingSize.value || loadingDashboard.value;
});

const hasLimitedStorage = computed(() => {
  return u?.value?.userData?.tier === 'EPHEMERAL';
});

const activeText = computed(() => {
  return `${prettyBytes(size.value.active)} of ${prettyBytes(size.value.limit)}`;
});

const percentageUsed = computed(() => {
  return (size.value.active * 100) / size.value.limit;
});
</script>
<template>
  <section class="min-w-72">
    <p v-if="error">{{ error.message }}</p>
    <h2 class="email">{{ user.email }}</h2>

    <LoadingComponent v-if="isLoading" />

    <div v-else>
      <p v-if="hasLimitedStorage">
        Total storage used:
        <span class="active">{{ size?.active }} active</span> /
        <span class="expired">{{ size?.expired }} expired</span>
      </p>

      <div v-if="!error && !loadingSize">
        <p class="font-bold">{{ activeText }}</p>
        <ProgressBarDashboard :percentage="percentageUsed" />
      </div>

      <p v-if="hasLimitedStorage">
        Your files expire after {{ DAYS_TO_EXPIRY }} days
      </p>
      <log-out-button :log-out="handleLogout" />
    </div>
  </section>
</template>

<style lang="css" scoped>
.expired {
  color: var(--colour-ti-critical);
}
.active {
  color: var(--colour-send-primary);
}
.email {
  color: #737584;
  font-weight: 400;
  font-size: 16px;
}
</style>
