<script setup lang="ts">
import { useMetricsUpdate } from '@/apps/common/mixins/metrics';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import init from '@/lib/init';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useMetricsStore from '@/stores/metrics';
import useUserStore from '@/stores/user-store';
import { onMounted } from 'vue';
import { INIT_ERRORS } from './const';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();
const { api } = useApiStore();
const { initializeClientMetrics, sendMetricsToBackend } = useMetricsStore();
const { updateMetricsIdentity } = useMetricsUpdate();

onMounted(async () => {
  // Non-zero values indicate a specific error has occurred.
  const errorCode = await init(userStore, keychain, folderStore);

  if (errorCode) {
    console.log('init error: ', Object.keys(INIT_ERRORS)[errorCode]);
    // Load from backend session and retry init()
    const didPopulate = await userStore.populateFromBackend();
    if (!didPopulate) {
      return;
    }
    await init(userStore, keychain, folderStore);
    userStore.store();

    await sendMetricsToBackend(api);
  }
  // Identify user for analytics
  const uid = userStore.user.uniqueHash;
  initializeClientMetrics(uid);
  await sendMetricsToBackend(api);
});

updateMetricsIdentity();
</script>

<template>
  <router-view></router-view>
</template>
