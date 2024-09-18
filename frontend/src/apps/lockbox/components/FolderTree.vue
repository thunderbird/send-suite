<script setup lang="ts">
import ReportContent from '@/apps/lockbox/components/ReportContent.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { FolderResponse } from '../stores/folder-store.types';
const folderStore = useFolderStore();

type ReportProps = {
  folder: FolderResponse;
  containerId: FolderResponse['id'];
};

defineProps<ReportProps>();
</script>
<template>
  <ul v-if="folder">
    <li v-for="file of folder.items" :key="file.uploadId">
      <a
        href="#"
        @click.prevent="
          folderStore.downloadContent(
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
      <ReportContent :upload-id="file.uploadId" :container-id="containerId" />
    </li>
  </ul>
</template>

<style scoped>
li {
  outline: 1px solid grey;
  margin: 1em auto;
  padding: 0.5rem;
}
</style>
