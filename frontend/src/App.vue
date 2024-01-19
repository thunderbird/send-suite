<script setup>
import { onMounted } from 'vue';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';

import { useRouter } from 'vue-router';
const router = useRouter();

const { user } = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  try {
    await user.load();
  } catch (e) {
    console.log(e);
    console.log(`could not load user`);
    return;
  }
  if (user.id) {
    console.log(`we have a user, attempting to log in`);
    await user.login();
    await folderStore.fetchUserFolders();
  }
  try {
    await keychain.load();
  } catch (e) {
    console.log(e);
    console.log(`could not load keys`);
    return;
  }
  console.log(`keychain loaded`);
});
</script>

<template>
  <router-view></router-view>
</template>
