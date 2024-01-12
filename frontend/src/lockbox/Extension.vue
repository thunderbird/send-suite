<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';

import Debug from '@/Debug.vue';
import Popup from './views/Popup.vue';

const router = useRouter();
const { user } = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  try {
    await keychain.load();
  } catch (e) {
    console.log(`no keys`);
    return;
  }
  console.log(`keychain loaded`);
  if (keychain.rsa.privateKey) {
    console.log(`we have keys, attempting to load user`);
    await user.load();
    await user.login();
    await folderStore.fetchUserFolders();

    if (!folderStore.defaultFolder) {
      // Creating a default folder
      console.log(`creating default folder`);
      const createFolderResp = await folderStore.createFolder();
      console.log(createFolderResp);
      if (createFolderResp) {
        console.log(`👍👍👍👍👍👍👍👍👍👍👍 created a folder`);
      } else {
        console.log(`could not create a folder 🐓🐓🐓🐓🐓🐓🐓🐓🐓🐓🐓`);
      }
    }
  }
});
</script>

<template>
  <Debug />
  <Popup />
</template>
