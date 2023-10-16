<script setup>
import { inject, watch } from 'vue';
import CreateShare from './CreateShare.vue';
import Downloader from '@/common/download';

const { currentFile, deleteItemAndContent } = inject('folderManager');

const api = inject('api');
const keychain = inject('keychain');
const downloader = new Downloader(keychain, api);

async function downloadContent() {
  console.log(`Starting download`);
  const { uploadId, folderId, wrappedKey, filename } = currentFile.value;
  const success = await downloader.doDownload(
    uploadId,
    folderId,
    wrappedKey,
    filename
  );
}
</script>

<template>
  <div v-if="currentFile">
    <h1>{{ currentFile.filename }}</h1>
    <a
      href="#"
      @click.prevent="
        downloadContent(
          currentFile.uploadId,
          currentFile.folderId,
          currentFile.wrappedKey,
          currentFile.filename
        )
      "
    >
      download
    </a>
    <a
      href="#"
      @click.prevent="
        deleteItemAndContent(currentFile.itemId, currentFile.folderId)
      "
    >
      delete
    </a>
    <ul>
      <li>{{ currentFile.id }}</li>
      <li>{{ currentFile.upload.size }} bytes</li>
      <li>{{ currentFile.upload.type }} (mime type)</li>
    </ul>
    <CreateShare :items="[currentFile]" />
    <!-- <template v-if="isDownloadReady">
    <Download :id="fileInfoObj.uploadId" :folderId="fileInfoObj.folderId" :wrappedKey="fileInfoObj.wrappedKey"
      :filename="fileInfoObj.filename" @downloadComplete="downloadComplete" @downloadAborted="downloadAborted" />
  </template> -->
  </div>
</template>
