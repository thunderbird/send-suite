<script setup>
import { ref, inject, onMounted } from 'vue';
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
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  const dirItems = await api.getAllFolders(user.id);
  console.log(dirItems);
  if (!dirItems) {
    return;
  }

  console.log(dirItems);
  folders.value = dirItems;
}

onMounted(async () => {
  loadFolderList();
});

user._addOnLoad(() => {
  loadFolderList();
})

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
      size, type
    }
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
  <h1>{{ user.email }}'s Lockbox</h1>
  <NewFolder />
  <Breadcrumbs @setFolderId="setFolderId" :folderPath="folderPath" />
  <FolderView @setFolderId="setFolderId" @setFileInfoObj="setFileInfoObj" @uploadComplete="uploadComplete"
    :folders="folders" :folderId="folderId" />
  <FileInfo v-if="fileInfoObj" :fileInfoObj="fileInfoObj" @deleteComplete="deleteComplete" />
</template>
