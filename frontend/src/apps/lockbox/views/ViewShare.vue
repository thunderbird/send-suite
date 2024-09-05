<script setup lang="ts">
import FolderTree from '@/apps/lockbox/components/FolderTree.vue';
import useSharingStore from '@/apps/lockbox/stores/sharing-store';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ContainerResponse } from '../stores/folder-store.types';

const route = useRoute();
const sharingStore = useSharingStore();

const folder = ref<ContainerResponse>(null);
const containerId = ref<number>(null);

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
