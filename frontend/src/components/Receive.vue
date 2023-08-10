<script setup>
import { ref } from 'vue';
import { download } from '../lib/filesync';
// import { streamToArrayBuffer } from '../lib/utils';
// import { blobStream } from '../lib/streams';

const fileId = ref('');
const message = ref('hello');

async function downloadMessage() {
  console.log(fileId.value);
  if (!fileId.value) {
    return;
  }
  const plaintextString = await download(fileId.value);
  console.log(plaintextString);
  message.value = plaintextString;
  // return plaintextString;
}
</script>

<template>
  <div>
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
