<script setup lang="ts">
import { onMounted, ref } from 'vue';

import init from '@/lib/init';

import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';

import ErrorUploading from '@/apps/lockbox/components/ErrorUploading.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import useSharingStore from '@/apps/lockbox/stores/sharing-store';

import { EXTENSION_READY, SHARE_ABORTED, SHARE_COMPLETE } from '@/lib/const';
import { restoreKeysUsingLocalStorage } from '@/lib/keychain';
import useApiStore from '@/stores/api-store';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const { api } = useApiStore();

const folderStore = useFolderStore();
const sharingStore = useSharingStore();

const isUploading = ref(false);
const isError = ref(false);

const password = ref('');
const fileBlob = ref(null);

// TODO: Make it so you can mix-and-match.
// i.e., you can convert attachment to lockbox
// *and* you can choose existing files.
// Need to decide if you should be able to designate
// the location of the file from the lockbox popup.
async function uploadAndShare() {
  try {
    isUploading.value = true;
    const itemObj = await folderStore.uploadItem(
      fileBlob.value,
      folderStore.defaultFolder.id
    );
    if (!itemObj) {
      uploadAborted();
      isError.value = true;
      isUploading.value = false;
      return;
    }
    fileBlob.value = null;
    const url = await sharingStore.shareItems([itemObj], password.value);
    if (!url) {
      shareAborted();
      isError.value = true;
      isUploading.value = false;
      return;
    }
    shareComplete(url);
    isUploading.value = false;
  } catch (error) {
    isError.value = true;
    isUploading.value = false;
    return;
  }
}

function uploadAborted() {
  console.log('upload aborted for reasons');
}

function shareComplete(url) {
  console.log(`you should tell the user that it's done`);
  // eslint-disable-next-line no-undef
  browser.runtime.sendMessage({
    type: SHARE_COMPLETE,
    url,
    aborted: false,
  });
  window.close();
}

function shareAborted() {
  console.log(`Could not finish creating share for Lockbox send`);
  // eslint-disable-next-line no-undef
  browser.runtime.sendMessage({
    type: SHARE_ABORTED,
    url: '',
    aborted: true,
  });
  window.close();
}

onMounted(async () => {
  try {
    await restoreKeysUsingLocalStorage(keychain, api);
    await init(userStore, keychain, folderStore);
    console.log(`

Just initialized and now we have:
userStore.user.id ${userStore.user.id}


`);
    console.log(`adding listener in Popup for runtime messages`);
    // eslint-disable-next-line no-undef
    browser.runtime.onMessage.addListener(async (message) => {
      console.log(message);
      const { data } = message;
      fileBlob.value = data;
      console.log(`We set the fileBlob to:`);
      console.log(data);
    });
    // eslint-disable-next-line no-undef
    browser.runtime.sendMessage({
      type: EXTENSION_READY,
    });
  } catch (e) {
    console.log(
      `Cannot access browser.runtime, probably not running as an extension`
    );
  }
});
</script>

<template>
  <h1>Attach via Lockbox</h1>
  <div v-if="isError">
    <ErrorUploading />
  </div>

  <div v-if="isUploading">
    <p>Uploading...</p>
  </div>

  <form @submit.prevent="uploadAndShare">
    <br />
    <label>
      Password for sharing:
      <input v-model="password" type="password" :disabled="isUploading" />
    </label>
    <br />
    <input type="submit" value="Encrypt and Upload" :disabled="isUploading" />
  </form>
</template>
