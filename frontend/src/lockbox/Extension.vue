<script setup>
import { onMounted } from 'vue';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';
import init from '@/lib/init';

import Debug from '@/Debug.vue';
import Popup from './views/Popup.vue';

const { user } = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  await init(user, keychain, folderStore);
});
</script>

<template>
  <Debug />
  <Popup />
</template>
