<script setup>
import { ref } from 'vue';
import { download } from '../lib/filesync';
// import { streamToArrayBuffer } from '../lib/utils';
// import { blobStream } from '../lib/streams';
import { loadKeyFromStorage } from '../lib/crypt';
import { ApiConnection } from '../lib/api';

const fileId = ref('');
const message = ref('hello');

const api = new ApiConnection('https://localhost:8088');

async function downloadMessage() {
  console.log(fileId.value);
  if (!fileId.value) {
    return;
  }
  const id = fileId.value;
  const size = await api.getUploadSize(id);

  if (!size) {
    return;
  }

  const realKey = await loadKeyFromStorage();
  let exported = await window.crypto.subtle.exportKey('raw', realKey);
  exported = new Uint8Array(exported);
  const plaintextString = await download(id, size, exported);
  console.log(plaintextString);
  message.value = plaintextString;
  // return plaintextString;
}
</script>

<template>
  <div>
    <ol>
      <li>add form element for container id</li>
      <li>retrieve private key for folder from storage</li>
      <li>download/decrypt all items in container</li>
    </ol>
    <form @submit.prevent>
      <label>
        Download a message:
        <input v-model="fileId" />
      </label>
      <button @click="downloadMessage">Download Message</button>
    </form>
    <textarea v-if="message">{{ message }}</textarea>
  </div>
</template>

<style scoped>
textarea {
  height: 5rem;
  width: 100%;
}
</style>
