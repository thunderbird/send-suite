<script setup>
import { ref, inject, provide, watch } from 'vue';
import Uploader from '@/common/upload';
/*
I need to know which one has been "selected"
But also, selection should only be enabled when run as an extension.

This is what I need to return from .onFileUpload.addListener callback:
return { url, aborted: false, };

But...I need to figure out:
- if I use the built-in "convert to...", what folder does it get uploaded to?
- how do I select a file from lockbox to attach?
  - am I now bypassing the cloudfile functionality and inserting my own link?

*/

const api = inject('api');
const user = inject('user');
const keychain = inject('keychain');

const uploader = new Uploader(user, keychain, api);
// Load folders once we have a user.
//
watch(
  () => user.value.id,
  () => {
    getFolders();
  }
);

const folders = ref([]);
const currentFolderId = ref(null);
const currentFile = ref(null);

async function setCurrentFolderId(id) {
  console.log(`just set the currentFolderId.value to ${id}`);
  currentFolderId.value = id;
  await setCurrentFile(null);
}

async function setCurrentFile(obj) {
  console.log(`you called Core.setCurrentFile with:`);
  console.log(obj);
  if (!obj) {
    // reset
    currentFile.value = null;
    return;
  }
  const { size, type } = await api.getUploadMetadata(obj.uploadId);
  currentFile.value = {
    ...obj,
    upload: {
      size,
      type,
    },
  };
}

// TODO: actually limit this to a specific folder
async function getFolders(root) {
  if (!user.value.id) {
    console.log(`no valid user id`);
    return;
  }
  if (!root) {
    folders.value = await api.getAllFolders(user.value.id);
    console.log(`loaded ${folders.value.length} folders`);
  } else {
    console.log(`TBD: what to do if we specify a root folder`);
  }
}

// Can I watch these?
function sharedWithMe() {
  // Folders I can access, but do not own
  // This is basically a filtering function.
}

// Can I watch these?
function sharedWithOthers() {
  // Folders I own, share with others
  // This is basically a filtering function.
}

async function search(searchString, maybeModifiedDate, maybeCreatedDate) {
  // Can only search titles, not contents
  // The date stuff could just be booleans for sorting
}

async function createDefaultFolder() {}

async function setDefaultFolder() {
  // should we be able to set a different default?
}

async function createFolder(parentFolderId = 0) {
  console.log(`you want to create a folder`);
  const response = await api.createFolder(user.value.id, 'Untitled');
  console.log(response);
  // await keychain.createAndAddContainerKey(1);
  await keychain.value.newKeyForContainer(response.id);
  await keychain.value.store();
  console.log(`TODO: only reload the one folder`);
  await getFolders();
}

async function uploadItem(fileBlob, folderId) {
  console.log(`Rendering Upload component with containerId and fileBlob`);
  const itemObj = await uploader.doUpload(fileBlob, folderId);
  if (itemObj) {
    getFolders();
  }
}
async function deleteFolder(id) {
  // remove self from group?
  // or burn the folder?
  const resp = await api.deleteContainer(id);
  if (resp) {
    console.log(`delete successful, updating folder list`);
    getFolders();
    setCurrentFile(null);
  }
}

async function copyItems(itemIds, destinationFolderId) {}

async function deleteItemAndContent(itemId, folderId) {
  // `true` as the third arg means delete the Content, not just the Item
  const result = await api.deleteItem(itemId, folderId, true);
  if (result) {
    getFolders();
    setCurrentFile(null);
  }
}

async function moveItems(itemIds, destinationFolderId) {
  // this.copy();
  // this.delete();
}

provide('folderManager', {
  folders,
  getFolders,
  createFolder,
  deleteFolder,
  currentFolderId,
  setCurrentFolderId,
  currentFile,
  setCurrentFile,
  uploadItem,
  deleteItemAndContent,
});
</script>

<template>
  <slot></slot>
</template>
