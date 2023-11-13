<script setup>
import { ref, inject } from 'vue';
import { useDropZone } from '@vueuse/core';
const { currentFolderId, uploadItem } = inject('folderManager');

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
        const blob = new Blob([buffer], { type: file.type });
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
  const result = await Promise.all(fileBlobs.value.map(async (blob) => {
    console.log(`uploading ${blob.name}`);
    const uploadResult = await uploadItem(blob, currentFolderId.value);
    console.log(uploadResult);
    return uploadResult;
  }));

  if (result?.length === fileBlobs.value.length) {
    filesMetadata.value = null;
  }
}
</script>

<template>
  <div ref="dropZoneRef" class="drag-and-drop"
  :class="{ active: isOverDropZone }">
    <slot></slot>
    <!-- <div>isOverDropZone: {{ isOverDropZone }}</div>
    <div v-for="(file, index) in filesMetadata" :key="index">
      <p>Name: {{ file.name }}</p>
      <p>Size: {{ file.size }}</p>
      <p>Type: {{ file.type }}</p>
      <p>Last modified: {{ file.lastModified }}</p>
    </div> -->
  </div>

  <button
    v-if="filesMetadata"
    type="submit"
    class="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
    @click="doUpload"
  >
    <span class="font-bold">Upload</span>

  </button>
</template>

<style scoped>
.active {
  outline: 1px solid red;
}
</style>
