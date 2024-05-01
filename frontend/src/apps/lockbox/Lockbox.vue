<script setup lang="ts">
import { onMounted } from 'vue';
import init from '@/lib/init';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore, { FolderStore } from '@/apps/lockbox/stores/folder-store';
import { User } from '@/lib/user';
import { Keychain } from '@/lib/keychain';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  // Non-zero values indicate a specific error has occurred.
  const errorCode = await init(userStore.user as User, keychain as Keychain, folderStore as unknown as FolderStore);

  if (errorCode) {
    // Load from backend session and retry init()
    const didPopulate = await userStore.populateFromSession();
    if (!didPopulate) {
      console.warn(`DEBUG: could not retrieve user; did mozilla login fail?`);
      return;
    }
    userStore.user.store();
    await init(userStore.user as User, keychain as Keychain, folderStore as unknown as FolderStore);
  }
});
</script>

<template>
  <router-view></router-view>
</template>
