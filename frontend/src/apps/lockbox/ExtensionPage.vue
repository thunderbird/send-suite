<script setup lang="ts">
import FeedbackBox from '@/apps/common/FeedbackBox.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import init from '@/lib/init';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { onMounted } from 'vue';

import PopupView from './views/PopupView.vue';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  await init(userStore, keychain, folderStore);
});
</script>

<template>
  <PopupView />
  <FeedbackBox />
</template>
