<script setup lang="ts">
import FolderTree from '@/apps/send/components/FolderTree.vue';
import useSharingStore from '@/apps/send/stores/sharing-store';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const sharingStore = useSharingStore();

const folder = ref(null);
const containerId = ref(null);

onMounted(async () => {
  console.log(`ViewShare ready to get folder for hash`);
  // Using route.params.linkId, get the folder contents
  const container = await sharingStore.getSharedFolder(
    route.params.linkId as string
  );
  folder.value = container;
  containerId.value = container.id;
});
</script>
<template>
  <h1>Shared files for folder id: {{ containerId }}</h1>

  <FolderTree :folder="folder" :container-id="containerId" />
</template>
