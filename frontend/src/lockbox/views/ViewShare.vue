<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRoute } from 'vue-router';
import Downloader from '@/common/download';

const route = useRoute();
const { getSharedFolder } = inject('sharingManager');

const api = inject('api');
const keychainRef = inject('keychainRef');
const downloader = new Downloader(keychainRef, api);

const folder = ref(null);
const containerId = ref(null);

async function downloadContent(uploadId, folderId, wrappedKey, filename) {
  console.log(`Starting download`);
  const success = await downloader.doDownload(
    uploadId,
    folderId,
    wrappedKey,
    filename
  );
}

onMounted(async () => {
  console.log(`ViewShare ready to get folder for hash`);
  // Using route.params.hash, get the folder contents
  const { share } = await getSharedFolder(route.params.hash);
  folder.value = share.container;
  containerId.value = share.container.id;
});
</script>
<template>
  <h1>Shared files for folder id: {{ containerId }}</h1>

  <ul class="file-list" v-if="folder">
    <li v-for="file of folder.items">
      <a
        href="#"
        @click.prevent="
          downloadContent(
            file.uploadId,
            containerId,
            file.wrappedKey,
            file.name
          )
        "
      >
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
