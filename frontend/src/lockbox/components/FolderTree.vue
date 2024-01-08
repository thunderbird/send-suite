<script setup>
import { inject } from 'vue';
import useApiStore from '@/stores/api-store';
import Downloader from '@/common/download';

const props = defineProps({
  folder: Object,
  containerId: Number,
});

const { api } = useApiStore();
const keychainRef = inject('keychainRef');
const downloader = new Downloader(keychainRef, api);

async function downloadContent(uploadId, folderId, wrappedKey, filename) {
  console.log(`Starting download`);
  const success = await downloader.doDownload(uploadId, folderId, wrappedKey, filename);
}
</script>
<template>
  <ul v-if="folder">
    <li v-for="file of folder.items">
      <a href="#" @click.prevent="downloadContent(file.uploadId, containerId, file.wrappedKey, file.name)">
        id: {{ file.uploadId }}<br />
        file name: {{ file.name }}<br />
        size: {{ file.upload.size }} bytes<br />
        mime type: {{ file.upload.type }}
      </a>
    </li>
  </ul>
</template>

<style scoped>
li a {
  display: block;
  outline: 1px solid grey;
}
</style>
