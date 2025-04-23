<script setup lang="ts">
import FolderTree from '@/apps/send/components/FolderTree.vue';
import useSharingStore from '@/apps/send/stores/sharing-store';
import logger from '@/logger';
import { Container } from '@/types';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const sharingStore = useSharingStore();

const folder = ref<Container>(null);
const containerId = ref(null);

onMounted(async () => {
  logger.info(`ViewShare ready to get folder for hash`);
  // Using route.params.linkId, get the folder contents
  const container = await sharingStore.getSharedFolder(
    route.params.linkId as string
  );
  folder.value = container;
  containerId.value = container.id;
});
</script>
<template>
  <div v-if="folder?.id">
    <h1>Shared files for folder id: {{ containerId }}</h1>
    <FolderTree :folder="folder" :container-id="containerId" />
  </div>
</template>
