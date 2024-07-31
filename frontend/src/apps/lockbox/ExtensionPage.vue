<script setup lang="ts">
import FeedbackBox from '@/apps/common/FeedbackBox.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import init from '@/lib/init';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { onMounted } from 'vue';

import { useMetricsUpdate } from '@/apps/common/mixins/metrics';
import useApiStore from '@/stores/api-store';
import useMetricsStore from '@/stores/metrics';
import PopupView from './views/PopupView.vue';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();
const { api } = useApiStore();
const { initializeClientMetrics, sendMetricsToBackend } = useMetricsStore();

onMounted(async () => {
  await init(userStore, keychain, folderStore);
  // Identify user for analytics
  const uid = userStore.user.hashedEmail;
  initializeClientMetrics(uid);
  await sendMetricsToBackend(api);
});

useMetricsUpdate();
</script>

<template>
  <PopupView />
  <FeedbackBox />
</template>
