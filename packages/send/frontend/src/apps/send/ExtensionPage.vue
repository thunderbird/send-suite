<script setup lang="ts">
import FeedbackBox from '@/apps/common/FeedbackBox.vue';
import useFolderStore from '@/apps/send/stores/folder-store';
import init from '@/lib/init';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { onMounted } from 'vue';

import { useMetricsUpdate } from '@/apps/common/mixins/metrics';
import useApiStore from '@/stores/api-store';
import useMetricsStore from '@/stores/metrics';
import { ModalsContainer } from 'vue-final-modal';
import CompatibilityBanner from '../common/CompatibilityBanner.vue';
import SecureSendIcon from '../common/SecureSendIcon.vue';
import StatusBar from '../common/StatusBar.vue';
import TBBanner from '../common/TBBanner.vue';
import PopupView from './views/PopupView.vue';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();
const { api } = useApiStore();
const { initializeClientMetrics, sendMetricsToBackend } = useMetricsStore();

onMounted(async () => {
  await init(userStore, keychain, folderStore);
  // Identify user for analytics
  const uid = userStore.user.uniqueHash;
  initializeClientMetrics(uid);
  await sendMetricsToBackend(api);
});

useMetricsUpdate();
</script>

<template>
  <div id="send-page" class="container">
    <CompatibilityBanner />
    <TBBanner />
    <PopupView />
    <SecureSendIcon />
    <FeedbackBox />
    <StatusBar />
    <ModalsContainer />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem 0;
  margin-top: 2rem;
}
p {
  color: #000;
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}
</style>
