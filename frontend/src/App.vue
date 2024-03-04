<script setup>
import { onMounted } from 'vue';
import init from '@/lib/init';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';

import { useRouter } from 'vue-router';
const router = useRouter();

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  const initErr = await init(userStore.user, keychain, folderStore);

  if (!initErr) {
    // Load from backend session and retry init()
    const didPopulate = await userStore.populateFromSession();
    if (!didPopulate) {
      console.warn(`DEBUG: could not retrieve user; did mozilla login fail?`);
      return;
    }
    userStore.user.store();
    await init(userStore.user, keychain, folderStore);

    // TODO: decide whether we need to check return value from init()
    // At this point, it would indicate that we don't have a keychain
  }
});
</script>

<template>
  <router-view></router-view>
</template>
