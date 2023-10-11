<script setup>
import { ref, inject } from 'vue';
// import Upload from '@/common/Upload.vue';
import Uploader from '@/common/upload';

const emit = defineEmits(['uploadComplete']);
const props = defineProps({
  folderId: Number,
});

const api = inject('api');
const user = inject('user');
const keychain = inject('keychain');

const uploader = new Uploader(user, keychain, api);

const message = ref('');
const fileBlob = ref(null);
const fileInput = ref(null);
// const isUploadReady = ref(false);

async function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const buffer = reader.result;
    fileBlob.value = new Blob([buffer], { type: file.type });
    fileBlob.value.name = file.name;
  };
  reader.readAsArrayBuffer(file);
  message.value = file.name;
}

async function doUpload(isText = true) {
  console.log(`Rendering Upload component with containerId and fileBlob`);
  const itemObj = await uploader.doUpload(fileBlob.value, props.folderId);
  if (itemObj) {
    message.value = '';
    fileBlob.value = null;
    emit('uploadComplete');
  }
}

// function uploadComplete() {
//   isUploadReady.value = false;
//   message.value = '';
//   fileBlob.value = null;
// }
</script>
<template>
  <form @submit.prevent>
    <input type="file" @change="handleFile" class="hidden" ref="fileInput" />
    <div v-if="props.folderId" class="sticky bottom-0">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
        @click="fileInput.click()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          class="h-6 w-6 text-gray-600"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          ></path>
        </svg>
      </button>
      <button
        v-if="fileBlob"
        type="submit"
        class="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
        @click="doUpload()"
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
    </div>
  </form>
  <!-- <template v-if="isUploadReady">
    <Upload
      :containerId="props.folderId"
      :fileBlob="fileBlob"
      @uploadComplete="uploadComplete"
    />
  </template> -->
</template>
