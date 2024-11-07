<script setup lang="ts">
import ReportContent from '@/apps/lockbox/components/ReportContent.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { ref } from 'vue';
import { FolderResponse } from '../stores/folder-store.types';
import SpinnerAnimated from './SpinnerAnimated.vue';
const folderStore = useFolderStore();

type ReportProps = {
  folder: FolderResponse;
  containerId: FolderResponse['id'];
};

const isDownloading = ref(new Map());
const isError = ref(false);

type Props = {
  uploadId: string;
  containerId: number;
  wrappedKey: string;
  name: string;
};

async function downloadContent({
  uploadId,
  containerId,
  wrappedKey,
  name,
}: Props) {
  isDownloading.value.set(uploadId, true);
  try {
    await folderStore.downloadContent(uploadId, containerId, wrappedKey, name);
  } catch (error) {
    isError.value = true;
    console.error(error);
  }
  isDownloading.value.delete(uploadId);
}

defineProps<ReportProps>();
</script>
<template>
  <ul v-if="folder">
    <div v-if="!folder?.items?.length">
      <p>This folder is empty or the files uploaded to it have expired</p>
    </div>
    <li
      v-for="{
        uploadId,
        name,
        wrappedKey,
        upload: { daysToExpiry, expired, size, type },
      } of folder.items"
      :key="uploadId"
    >
      <div class="flex justify-between">
        <div>
          id: {{ uploadId }}<br />
          file name: {{ name }}<br />
          size: {{ size }} bytes<br />
          mime type: {{ type }}<br />
          <div>
            <span v-if="expired" class="text-red-500">Expired</span>
            <span v-else>expires in: {{ daysToExpiry }} days</span>
          </div>
        </div>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none: disabled:bg-gray-400"
          :disabled="isDownloading.has(uploadId) || expired"
          @click.prevent="
            downloadContent({
              uploadId,
              containerId,
              wrappedKey,
              name,
            })
          "
        >
          <div
            v-if="isDownloading.has(uploadId)"
            class="flex justify-center items-center"
          >
            <span>Downloading</span>
            <SpinnerAnimated />
          </div>
          <div v-else>
            <span class="font-bold">Download</span>
          </div>
        </button>
      </div>
      <div v-if="!expired">
        <ReportContent :upload-id="uploadId" :container-id="containerId" />
      </div>
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
