<script setup>
import { ref, inject } from 'vue';
import CreateShare from './CreateShare.vue';
// import Download from '@/common/Download.vue';
import Downloader from '@/common/download';

const emit = defineEmits(['deleteComplete']);
const props = defineProps({
  fileInfoObj: Object,
});

const api = inject('api');
const keychain = inject('keychain');
const downloader = new Downloader(keychain, api);
// const isDownloadReady = ref(false);

async function deleteItemAndContent(itemId, folderId) {
  // `true` as the third arg means delete the Content, not just the Item
  const result = await api.deleteItem(itemId, folderId, true);
  if (result) {
    emit('deleteComplete');
  }
}

async function downloadContent() {
  console.log(`Starting download`);
  // isDownloadReady.value = true;
  const { uploadId, folderId, wrappedKey, filename } = props.fileInfoObj;
  const success = await downloader.doDownload(
    uploadId,
    folderId,
    wrappedKey,
    filename
  );
}

// function downloadComplete() {
//   console.log('Finished downloading');
//   isDownloadReady.value = false;
// }
// function downloadAborted() {
//   console.log(`Download aborted`);
//   isDownloadReady.value = false;
// }
</script>

<template>
  <h1>{{ fileInfoObj.filename }}</h1>
  <a
    href="#"
    @click.prevent="
      downloadContent(
        fileInfoObj.uploadId,
        fileInfoObj.folderId,
        fileInfoObj.wrappedKey,
        fileInfoObj.filename
      )
    "
  >
    download
  </a>
  <a
    href="#"
    @click.prevent="
      deleteItemAndContent(fileInfoObj.itemId, fileInfoObj.folderId)
    "
  >
    delete
  </a>
  <ul>
    <li>{{ fileInfoObj.id }}</li>
    <li>{{ fileInfoObj.upload.size }} bytes</li>
    <li>{{ fileInfoObj.upload.type }} (mime type)</li>
  </ul>
  <CreateShare :items="[fileInfoObj]" />
  <!-- <template v-if="isDownloadReady">
    <Download :id="fileInfoObj.uploadId" :folderId="fileInfoObj.folderId" :wrappedKey="fileInfoObj.wrappedKey"
      :filename="fileInfoObj.filename" @downloadComplete="downloadComplete" @downloadAborted="downloadAborted" />
  </template> -->
</template>
