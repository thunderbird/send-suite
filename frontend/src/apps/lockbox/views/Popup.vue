<script setup>
import { ref, watch } from 'vue';
import useUserStore from '@/stores/user-store';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import useSharingStore from '@/apps/lockbox/stores/sharing-store';

import { EXTENSION_READY, SHARE_COMPLETE, SHARE_ABORTED, SELECTION_COMPLETE } from '@/lib/const';

const { user } = useUserStore();
const folderStore = useFolderStore();
const sharingStore = useSharingStore();

const password = ref('');
const fileBlob = ref(null);

// TODO: Make it so you can mix-and-match.
// i.e., you can convert attachment to lockbox
// *and* you can choose existing files.
// Need to decide if you should be able to designate
// the location of the file from the lockbox popup.
async function uploadAndShare() {
  const itemObj = await folderStore.uploadItem(fileBlob.value, folderStore.defaultFolder.id);
  if (!itemObj) {
    uploadAborted();
    return;
  }
  fileBlob.value = null;
  const url = await sharingStore.shareItems([itemObj], password.value);
  if (!url) {
    shareAborted();
    return;
  }
  shareComplete(url);
}

function uploadAborted() {
  console.log('upload aborted for reasons');
}

function shareComplete(url) {
  console.log(`you should tell the user that it's done`);
  browser.runtime.sendMessage({
    type: SHARE_COMPLETE,
    url,
    aborted: false,
  });
  window.close();
}

function shareAborted() {
  console.log(`Could not finish creating share for Lockbox send`);
  browser.runtime.sendMessage({
    type: SHARE_ABORTED,
    url: '',
    aborted: true,
  });
  window.close();
}

watch(
  () => user.id,
  () => {
    try {
      console.log(`adding listener in Popup for runtime messages`);
      browser.runtime.onMessage.addListener(async (message, sender) => {
        console.log(message);
        const { data } = message;
        fileBlob.value = data;
        console.log(`We set the fileBlob to:`);
        console.log(data);
      });

      browser.runtime.sendMessage({
        type: EXTENSION_READY,
      });
    } catch (e) {
      console.log(`Cannot access browser.runtime, probably not running as an extension`);
    }
  }
);
</script>

<template>
  <h1>Attach via Lockbox</h1>
  <form @submit.prevent="uploadAndShare">
    <br />
    <label>
      Password for sharing:
      <input type="password" v-model="password" />
    </label>
    <br />
    <input type="submit" value="Encrypt and Upload" />
  </form>
</template>
