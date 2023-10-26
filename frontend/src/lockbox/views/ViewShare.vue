<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRoute } from 'vue-router';
import FolderTree from '../components/FolderTree.vue';

const route = useRoute();
const { getSharedFolder } = inject('sharingManager');

const folder = ref(null);
const containerId = ref(null);

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

  <FolderTree :folder="folder" :containerId="containerId" />
</template>
