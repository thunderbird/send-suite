<script setup lang="ts">
import useFolderStore from '@/apps/lockbox/stores/folder-store';
const folderStore = useFolderStore();

const props = defineProps({
  folder: Object,
  containerId: Number,
});
</script>
<template>
  <ul v-if="folder">
    <li v-for="file of folder.items">
      <a href="#" @click.prevent="folderStore.downloadContent(file.uploadId, containerId, file.wrappedKey, file.name)">
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
