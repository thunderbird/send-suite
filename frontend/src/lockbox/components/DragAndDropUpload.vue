<script setup>
import { ref, inject } from 'vue';
import { useDropZone } from '@vueuse/core';
const { currentFolderId, uploadItem } = inject('folderManager');

const dropZoneRef = ref();

const filesMetadata = ref([]);
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

function doUpload() {
  fileBlobs.value.forEach((blob) => {
    console.log(`uploading ${blob.name}`);
    uploadItem(blob, currentFolderId.value);
  });
}
</script>

<template>
  <div ref="dropZoneRef" class="drag-and-drop">
    <div>isOverDropZone: {{ isOverDropZone }}</div>
    <div v-for="(file, index) in filesMetadata" :key="index">
      <p>Name: {{ file.name }}</p>
      <p>Size: {{ file.size }}</p>
      <p>Type: {{ file.type }}</p>
      <p>Last modified: {{ file.lastModified }}</p>
    </div>
  </div>
  <br />
  <button
    v-if="filesMetadata"
    type="submit"
    class="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
    @click="doUpload"
  >
    <span class="font-bold">Upload</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      class="h-6 w-6 ml-2 transform rotate-90"
    >
      <path
        d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
      ></path>
    </svg>
  </button>
</template>

<style scoped>
.drag-and-drop {
  width: 500px;
  height: 200px;
  outline: 1px solid red;
}
</style>
