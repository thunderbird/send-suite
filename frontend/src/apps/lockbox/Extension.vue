<script setup lang="ts">
import { onMounted } from 'vue';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import init from '@/lib/init';

import Popup from './views/Popup.vue';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  await init(userStore, keychain, folderStore);
});
</script>

<template>
  <Popup />
</template>
