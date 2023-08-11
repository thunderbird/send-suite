<script setup>
import { ref } from 'vue';
import { upload } from '../lib/filesync';
import { loadKeyFromStorage } from '../lib/crypt';
import { encryptStream } from '../lib/ece';
import { blobStream, concatStream } from '../lib/streams';

const fileBlob = ref(null);
const uploadId = ref('');

async function sendBlob(blob) {
  console.log(`want to send blob`);
  console.log(blob);
  // const aesKey = crypto.getRandomValues(new Uint8Array(16)); //await loadKeyFromStorage();
  const realKey = await loadKeyFromStorage();
  let exported = await window.crypto.subtle.exportKey('raw', realKey);
  exported = new Uint8Array(exported);
  // debugger;
  if (exported) {
    console.log(`Encrypting blob before uploading using ${exported}`);
    const stream = blobStream(blob);
    const result = await upload(stream, exported);
    console.log(result);
    return result;
  }
  return;
  // return result;
  // const userObj = user.value;
  // console.log(`sending from ${userObj.email} to ${recipientAddress.value}`);
  // const isValidUser = await api.value.userExists(recipientAddress.value);
  // if (isValidUser) {
  //   const archive = new Archive([blob]);
  //   const sender = new Sender(fileManager.value);
  //   const file = await sender.upload(archive, null, password.value);
  //   const item = await api.value.createItem(file.url, userObj.id, isFile.value);
  //   if (item) {
  //     await api.value.shareWith(item.id, userObj.email, [
  //       recipientAddress.value,
  //     ]);
  //   } else {
  //     alert(`could not share with ${recipientAddress.value}`);
  //   }
  // } else {
  //   alert(`User does not exist.`);
  // }
}

async function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const buffer = reader.result;
    fileBlob.value = new Blob([buffer], { type: file.type });
    fileBlob.value.name = file.name;
  };
  reader.readAsArrayBuffer(file);
}

async function sendFile() {
  // const result = await sendBlob(fileBlob.value);
  // uploadId.value = result.id;
  const blob = new Blob(['hello there'], { type: 'text/plain' });
  blob.name = `${new Date().getTime()}.txt`;
  // isFile.value = false;
  const result = await sendBlob(blob);
  uploadId.value = result.id;
}
</script>

<template>
  <div>
    <form @submit.prevent>
      <!-- <label>
        Upload a file:
        <input type="file" @change="handleFile" />
      </label>
      <br /> -->
      <button @click="sendFile">Send Message</button>
    </form>
    <p v-if="uploadId">Uploaded: {{ uploadId }}</p>
  </div>
</template>

<style scoped></style>
