<script setup>
import { ref, inject, watch } from 'vue';
// import LockboxUI from './Home.vue';
import FolderView from '../components/FolderView.vue';
// import Upload from '@/common/Upload.vue';
import Uploader from '@/common/upload';
// import Share from '@/common/Share.vue';
import Sharer from '@/common/share';
import {
  EXTENSION_READY,
  SHARE_COMPLETE,
  SHARE_ABORTED,
  SELECTION_COMPLETE,
} from '@/lib/const';

const api = inject('api');
const user = inject('user');
const keychain = inject('keychain');

const sharer = new Sharer(user, keychain, api);
const uploader = new Uploader(user, keychain, api);

const folders = ref([]);
const itemMap = ref(null);

const password = ref('');
const fileBlob = ref(null);
const folderId = ref(null);
const fileInfoObj = ref(null);
// const itemObj = ref(null);
const isUploadReady = ref(false);
// const isShareReady = ref(false);

const selectedItems = ref([]);

function setFolderId(id) {
  console.log(`Lockbox sees choice of ${id}`);
  folderId.value = id;
  setFileInfoObj(null);
}

async function setFileInfoObj(obj) {
  console.log(`you called setFileInfoObj with:`);
  console.log(obj);
  if (!obj) {
    // reset
    fileInfoObj.value = null;
    return;
  }
  const { size, type } = await api.getUploadMetadata(obj.uploadId);
  fileInfoObj.value = {
    ...obj,
    upload: {
      size,
      type,
    },
  };
}

function toggleSelection(itemId) {
  console.log(`here is the itemId to toggle: ${itemId}`);
  if (selectedItems.value.includes(itemId)) {
    // remove
    selectedItems.value = selectedItems.value.filter((id) => id !== itemId);
  } else {
    // add
    selectedItems.value = [...selectedItems.value, itemId];
  }
}

function createItemMap(folders) {
  const map = {};
  // TODO: optimize this
  for (let folder of folders) {
    for (let item of folder.items) {
      const { name, uploadId, wrappedKey, type } = item;
      map[item.id] = {
        containerId: folder.id,
        name,
        uploadId,
        wrappedKey,
        type,
      };
    }
  }
  itemMap.value = map;
  console.log(map);
}

async function uploadAndShare() {
  // isUploadReady.value = true;
  if (selectedItems.value.length > 0) {
    // get the necessary info for each itemId
    const itemsToShare = selectedItems.value.map((id) => itemMap.value[id]);

    const url = await sharer.doShare(itemsToShare, password.value);
    if (!url) {
      console.log(`cannot doShare`);
      return;
    }
    browser.runtime.sendMessage({
      type: SELECTION_COMPLETE,
      url,
      aborted: false,
    });
    window.close();
    // console.log(`will share the following:`);
    // console.log(itemsToShare);
  } else {
    const itemObj = await uploader.doUpload(fileBlob.value, folderId.value);
    if (!itemObj) {
      uploadAborted();
      return;
    }
    fileBlob.value = null;
    const url = await sharer.doShare([itemObj], password.value);
    if (!url) {
      shareAborted();
      return;
    }
    shareComplete(url);
  }
}

// async function uploadComplete(item) {
//   isUploadReady.value = false;
//   fileBlob.value = null;
//   // itemObj.value = [item];
//   // isShareReady.value = true;
//   const url = await sharer.doShare([item], password.value);
//   if (!url) {
//     shareAborted();
//   }
//   shareComplete(url);
// }

function uploadAborted() {
  isUploadReady.value = false;
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
  // isShareReady.value = false;
}

function shareAborted() {
  console.log(`Could not finish creating share for Lockbox send`);
  browser.runtime.sendMessage({
    type: SHARE_ABORTED,
    url: '',
    aborted: true,
  });
  window.close();
  // isShareReady.value = false;
}

function selectionComplete(fileInfo) {
  // itemObj.value = [item];
  // isShareReady.value = true;
}

// 1. get a folder (later, the "default" one)
async function loadFolderList() {
  if (!user.value.id) {
    console.log(`no valid user id`);
    return;
  }
  const dirItems = await api.getAllFolders(user.value.id);
  console.log(dirItems);
  if (!dirItems) {
    return;
  }

  folders.value = dirItems;
  createItemMap(dirItems);

  // TODO: use a folder designated for uploads,
  // this is just using the first one
  if (folders.value.length > 0) {
    folderId.value = folders.value[0].id;
  }
}

watch(
  () => user.value.id,
  () => {
    loadFolderList();
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
      console.log(
        `Cannot access browser.runtime, probably not running as an extension`
      );
    }
  }
);
</script>

<template>
  <h1>Lockbox attachment</h1>
  <div>
    <h2>selected items</h2>
    <p>{{ selectedItems }}</p>
  </div>
  <FolderView
    @setFolderId="setFolderId"
    @setFileInfoObj="setFileInfoObj"
    @uploadComplete="uploadComplete"
    @deleteFolder="deleteFolder"
    :folders="folders"
    :folderId="folderId"
    @toggleSelection="toggleSelection"
  />
  <form @submit.prevent="uploadAndShare">
    <br />
    <label>
      Password for sharing:
      <input type="password" v-model="password" />
    </label>
    <br />
    <input type="submit" value="Encrypt and Upload" />
  </form>
  <!-- <template v-if="isUploadReady">
    <Upload
      :containerId="folderId"
      :fileBlob="fileBlob"
      @uploadComplete="uploadComplete"
      @uploadAborted="uploadAborted"
    />
  </template> -->
  <!-- <template v-if="isShareReady">
    <Share
      :items="itemObj"
      :password="password"
      @shareComplete="shareComplete"
      @shareAborted="shareAborted"
    />
  </template> -->
  <!-- <LockboxUI /> -->
</template>
