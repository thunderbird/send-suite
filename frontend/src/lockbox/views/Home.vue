<script setup>
import { ref } from 'vue';
import NewFolder from '../components/NewFolder.vue';
import FolderView from '../components/FolderView.vue';
import Breadcrumbs from '../components/Breadcrumbs.vue';

const fileId = ref(null);
function setFileId(id) {
  console.log(`Lockbox sees choice of ${id}`);
  fileId.value = id;
}

const folderId = ref(null);
function setFolderId(id) {
  console.log(`Lockbox sees choice of ${id}`);
  folderId.value = id;
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
  <h2>Folder {{ folderId }} selected</h2>
  <NewFolder />
  <Breadcrumbs @setFolderId="setFolderId" :folderPath="folderPath" />
  <FolderView @setFolderId="setFolderId" :folderId="folderId" />
</template>
