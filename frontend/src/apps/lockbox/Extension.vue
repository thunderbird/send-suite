<script setup lang="ts">
import { onMounted } from 'vue';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore, { FolderStore } from '@/apps/lockbox/stores/folder-store';
import init from '@/lib/init';

import Popup from './views/Popup.vue';
import { User } from '@/lib/user';
import { Keychain } from '@/lib/keychain';

const { user } = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  await init(user as User, keychain as Keychain, folderStore as unknown as FolderStore);
});
</script>

<template>
  <Popup />
</template>
