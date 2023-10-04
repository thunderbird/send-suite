<script setup>
import { ref, inject, onMounted, watch } from 'vue';
import NewFolder from '../components/NewFolder.vue';
import FolderView from '../components/FolderView.vue';
import Breadcrumbs from '../components/Breadcrumbs.vue';
import FileInfo from '../components/FileInfo.vue';

const api = inject('api');
const user = inject('user');

const folders = ref([]);
const fileInfoObj = ref(null);

// TODO: actually limit this to a specific folder
async function loadFolderList(root = null) {
  if (!user.value.id) {
    console.log(`no valid user id`);
    return;
  }
  const dirItems = await api.getAllFolders(user.value.id);
  console.log(dirItems);
  if (!dirItems) {
    return;
  }

  console.log(dirItems);
  folders.value = dirItems;
}

onMounted(async () => {
  loadFolderList();

  // detect if we're loaded as tb extension
  try {
    messenger.cloudFile.onFileUpload.addListener(() => { });
    console.log(`didn't die trying to onFileUpload.addListener`);
    messenger.cloudFile.onFileUploadAbort.addListener(() => { })
    messenger.cloudFile.onFileDeleted.addListener(() => { })
    messenger.cloudFile.onAccountDeleted.addListener(accountId => { })
  } catch (e) {
    console.log(`pooped out when trying to onFileUpload.addListener`);
  }

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



});

watch(
  () => user.value.id,
  () => {
    loadFolderList();
  }
);

function createComplete() {
  console.log(`finished uploading, reloading folder list`);
  console.log(`TODO: only reload the one folder`);
  loadFolderList();
}

function uploadComplete() {
  console.log(`finished uploading, reloading folder list`);
  console.log(`TODO: only reload the one folder`);
  loadFolderList();
}

function deleteComplete() {
  console.log(`deleted a file, reloading folder list`);
  console.log(`TODO: only reload the one folder`);
  loadFolderList();
  setFileInfoObj(null);
}

function updateFolder(folderId) {
  // TODO: limit this to a single folder
  loadFolderList();
}

async function deleteFolder(id) {
  const resp = await api.deleteContainer(id);
  if (resp) {
    console.log(`delete successful, updating folder list`);
    loadFolderList();
    setFileInfoObj(null);
  }
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

const folderId = ref(null);
function setFolderId(id) {
  console.log(`Lockbox sees choice of ${id}`);
  folderId.value = id;
  setFileInfoObj(null);
}

// For the breadcrumbs
const folderPath = ref([]);
function pushFolder(folderObj) {
  folderPath.value.push(folderObj);
}
function popFolder() {
  folderPath.value.pop();
}
function gotoFolder(id) {
  // find the index where folder.id === id
  // slice up to that index
}
function reloadFolder(id) {
  // TODO: move folder getting/loading functionality here
}
</script>

<template>
  <div class="lockbox-container">
    <h1>{{ user.email }}'s Lockbox</h1>
    <NewFolder @createComplete="createComplete" />
    <Breadcrumbs @setFolderId="setFolderId" :folderPath="folderPath" />
    <div class="lockbox-main">
      <div>
        <FolderView @setFolderId="setFolderId" @setFileInfoObj="setFileInfoObj" @uploadComplete="uploadComplete"
          @deleteFolder="deleteFolder" :folders="folders" :folderId="folderId" />
      </div>
      <div>
        <div class="lockbox-fileinfo">
          <FileInfo v-if="fileInfoObj" :fileInfoObj="fileInfoObj" @deleteComplete="deleteComplete" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lockbox-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.lockbox-main {
  display: flex;
  flex-direction: row;
}

.lockbox-fileinfo {
  position: sticky;
  top: 2rem;
}
</style>
