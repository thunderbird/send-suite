<script setup lang="ts">
import ErrorUploading from '@/apps/lockbox/components/ErrorUploading.vue';
import UploadingProgress from '@/apps/lockbox/components/UploadingProgress.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { NamedBlob } from '@/lib/filesync';
import useApiStore from '@/stores/api-store';
import { useDropZone } from '@vueuse/core';
import { ref } from 'vue';
import ProgressBar from './ProgressBar.vue';

const folderStore = useFolderStore();
const { api } = useApiStore();
const dropZoneRef = ref();

const filesMetadata = ref(null);
const fileBlobs = ref<NamedBlob[]>([]);
const isUploading = ref(false);
const isError = ref(false);

function onDrop(files) {
  filesMetadata.value = [];
  fileBlobs.value = [];

  if (files) {
    filesMetadata.value = files.map((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result;
        const blob = new Blob([buffer], { type: file.type }) as NamedBlob;
        blob.name = file.name;
        fileBlobs.value.push(blob);
      };
      reader.readAsArrayBuffer(file);

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
    });
  }
}

useDropZone(dropZoneRef, onDrop);

async function doUpload() {
  const result = await Promise.all(
    fileBlobs.value.map(async (blob) => {
      isUploading.value = true;
      try {
        const uploadResult = await folderStore.uploadItem(
          blob,
          folderStore.rootFolder.id,
          api
        );
        isUploading.value = false;
        console.log(uploadResult);
        return uploadResult;
      } catch (e) {
        isError.value = true;
        isUploading.value = false;
        return;
      }
    })
  );

  if (result?.length === fileBlobs.value.length) {
    filesMetadata.value = null;
  }
}
</script>

<template>
  <div v-if="isError">
    <ErrorUploading />
  </div>

  <div v-if="isUploading">
    <ProgressBar type="Uploading" />
    <UploadingProgress />
  </div>

  <div v-else>
    <div ref="dropZoneRef" class="h-full">
      <slot></slot>
    </div>

    <button
      v-if="folderStore.rootFolder && filesMetadata"
      type="submit"
      class="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
      @click="doUpload"
    >
      <span class="font-bold">Upload</span>
    </button>
  </div>
</template>
