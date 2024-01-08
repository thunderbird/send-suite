<script setup>
import { ref, inject, watch } from 'vue';
import useConfigurationStore from '@/stores/configuration-store';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';

import FolderView from '../components/FolderView.vue';
import Uploader from '@/common/upload';
import Sharer from '@/common/share';
import { EXTENSION_READY, SHARE_COMPLETE, SHARE_ABORTED, SELECTION_COMPLETE } from '@/lib/const';

// const configurationStore = useConfigurationStore();

const { api } = useApiStore();
const { user } = useUserStore();
const { keychain } = useKeychainStore();

const { getDefaultFolder, currentFolderId, folders, uploadItem } = inject('folderManager');

const { itemMap, createItemMap, selectedItemsForSharing } = inject('sharingManager');

const sharer = new Sharer(user, keychain, api);
const uploader = new Uploader(user, keychain, api);

const password = ref('');
const fileBlob = ref(null);

// TODO: Make it so you can mix-and-match.
// i.e., you can convert attachment to lockbox
// *and* you can choose existing files.
// Need to decide if you should be able to designate
// the location of the file from the lockbox popup.
async function uploadAndShare() {
  /*
The way I've got this written now:
- if the user selects items, it overrides/ignores the fileBlob we were passed via browser.runtime.onMessage
- what I should do is:
  - if we have a fileBlob, don't show the FolderView
  - separate out these two processes:
    - upload, add new item to selectedForSharing
    - just share what's selectedForSharing
  - from popup, we do steps 1 and 2
  - from share-from-lockbox, we only do step 2
  */

  if (selectedItemsForSharing.value.length > 0) {
    // We've already got items to share
    // get the necessary info for each itemId
    const itemsToShare = selectedItemsForSharing.value.map((id) => itemMap.value[id]);

    const url = await sharer.shareItemsWithPassword(itemsToShare, password.value);
    if (!url) {
      console.log(`cannot shareItems`);
      return;
    }
    browser.runtime.sendMessage({
      // TODO: this type needs to be renamed to `SHARING_COMPLETE` or something
      type: SELECTION_COMPLETE,
      url,
      aborted: false,
    });
    window.close();
  } else {
    // Otherwise, we're converting,
    // meaning we need to upload and then share

    const defaultFolder = getDefaultFolder();

    const itemObj = await uploader.doUpload(fileBlob.value, defaultFolder.id);
    if (!itemObj) {
      uploadAborted();
      return;
    }
    fileBlob.value = null;
    const url = await sharer.shareItemsWithPassword([itemObj], password.value);
    if (!url) {
      shareAborted();
      return;
    }
    shareComplete(url);
  }
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
  () => folders.value,
  () => {
    createItemMap(folders.value);
  }
);

watch(
  () => user.id,
  () => {
    try {
      console.log(`adding listener in Popup for runtime messages`);
      browser.runtime.onMessage.addListener(async (message, sender) => {
        // console.log(message);
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
  <!-- <div>
    <h2>selected items</h2>
    <p>{{ selectedItemsForSharing }}</p>
  </div> -->
  <!-- <FolderView v-if="!fileBlob" /> -->
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
@/stores/configuration-store
