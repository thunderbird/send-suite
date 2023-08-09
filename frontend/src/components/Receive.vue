<script setup>
import { ref } from 'vue';
import { download } from '../lib/filesync';
// import { streamToArrayBuffer } from '../lib/utils';
// import { blobStream } from '../lib/streams';

const fileId = ref('');

async function downloadFile() {
  console.log(fileId.value);
  if (!fileId.value) {
    return;
  }
  const downloadResponse = await download(fileId.value);
  const { size } = downloadResponse;

  // here's where we would decrypt:
  // const plainStream = blobStream(ciphertext);
  const plaintext = await downloadResponse.arrayBuffer();
  const decoder = new TextDecoder();
  const plaintextString = decoder.decode(plaintext);
  // console.log(plaintextString);
  return plaintextString;
}
</script>

<template>
  <div>
    <form @submit.prevent>
      <label>
        Download a file:
        <input v-model="fileId" />
      </label>
      <button @click="downloadFile">Download File</button>
    </form>
  </div>
</template>

<style scoped></style>
