<script setup>
import { onMounted } from 'vue';
import init from '@/lib/init';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  // Non-zero values indicate a specific error has occurred.
  const errorCode = await init(userStore.user, keychain, folderStore);

  if (errorCode) {
    // Load from backend session and retry init()
    const didPopulate = await userStore.populateFromSession();
    if (!didPopulate) {
      console.warn(`DEBUG: could not retrieve user; did mozilla login fail?`);
      return;
    }
    userStore.user.store();
    await init(userStore.user, keychain, folderStore);
  }
});
</script>

<template>
  <router-view></router-view>
</template>
