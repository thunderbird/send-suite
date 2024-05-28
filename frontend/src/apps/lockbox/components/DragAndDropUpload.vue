<script setup lang="ts">
import { ref } from 'vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { NamedBlob } from '@/lib/filesync';
import { useDropZone } from '@vueuse/core';
const folderStore = useFolderStore();

const dropZoneRef = ref();

const filesMetadata = ref(null);
const fileBlobs = ref([]);
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

const { isOverDropZone } = useDropZone(dropZoneRef, onDrop);

async function doUpload() {
  const result = await Promise.all(
    fileBlobs.value.map(async (blob) => {
      console.log(`uploading ${blob.name}`);
      const uploadResult = await folderStore.uploadItem(blob, folderStore.rootFolder.id);
      console.log(uploadResult);
      return uploadResult;
    })
  );

  if (result?.length === fileBlobs.value.length) {
    filesMetadata.value = null;
  }
}
</script>

<template>
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
</template>
