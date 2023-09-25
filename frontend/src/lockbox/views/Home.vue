<script setup>
import { ref, inject } from 'vue';
import NewFolder from '../components/NewFolder.vue';
import FolderView from '../components/FolderView.vue';
import Breadcrumbs from '../components/Breadcrumbs.vue';
import FileInfo from '../components/FileInfo.vue';

const api = inject('api');

const fileInfoObj = ref(null);
async function setFileInfoObj(obj) {

  console.log(`you called setFileInfoObj with:`);
  console.log(obj);
  if (!obj) {
    // reset
    fileInfoObj.value = null;
    return;
  }
  const { size, type } = await api.getUploadMetadata(obj.id);
  fileInfoObj.value = { ...obj, size, type };
}

const folderId = ref(null);
function setFolderId(id) {
  console.log(`Lockbox sees choice of ${id}`);
  folderId.value = id;
  setFileInfoObj(null);
}

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
</script>

<template>
  <h1>This is lockbox</h1>
  <NewFolder />
  <Breadcrumbs @setFolderId="setFolderId" :folderPath="folderPath" />
  <FolderView @setFileInfoObj="setFileInfoObj" @setFolderId="setFolderId" :folderId="folderId" />
  <FileInfo v-if="fileInfoObj" :fileInfoObj="fileInfoObj" />
</template>
