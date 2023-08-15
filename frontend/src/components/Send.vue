<script setup>
import { ref, onMounted } from 'vue';
import { upload } from '../lib/filesync';
import { loadKeyFromStorage } from '../lib/crypt';
import { encryptStream } from '../lib/ece';
import { blobStream } from '../lib/streams';
import { ApiConnection } from '../lib/api';

const fileBlob = ref(null);
const uploadId = ref('');
const containerId = ref(1);
const ownerId = ref(1);
const message = ref('hello this is the default message');

const api = new ApiConnection('https://localhost:8088');
console.log(api.toString());
async function sendBlob(blob) {
  console.log(`want to send blob of size ${blob.size}`);
  console.log(blob);

  const realKey = await loadKeyFromStorage();
  let exported = await window.crypto.subtle.exportKey('raw', realKey);
  exported = new Uint8Array(exported);
  // debugger;
  if (realKey) {
    // console.log(`Encrypting blob before uploading using ${exported}`);
    const stream = blobStream(blob);
    const result = await upload(stream, realKey);
    console.log(result);
    return result.id;
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

async function sendMessage() {
  // const result = await sendBlob(fileBlob.value);
  // uploadId.value = result.id;
  const filename = `${new Date().getTime()}.txt`;
  const blob = new Blob([message.value], {
    type: 'text/plain',
  });
  blob.name = filename;
  // isFile.value = false;
  const id = await sendBlob(blob);
  uploadId.value = id;

  const uploadResp = await api.createUpload(id, blob.size, 1);
  console.log(uploadResp);

  if (id !== uploadResp.id) {
    debugger;
  }
  // create the Item, adding to `containerId`
  const itemResp = await api.createItemInContainer(
    id,
    containerId.value,
    filename,
    'MESSAGE'
  );
  console.log(`🎉 here it is...`);
  console.log(itemResp);
}
</script>

<template>
  <div>
    <ol>
      <li class="done">
        create a container in insomnia, add an input for the container id
      </li>
      <li class="done">create a private key for folder, store it locally</li>
      <li class="done">encrypt with private key for each message</li>
      <li>create an item for the upload, putting it in container</li>
    </ol>
    <form @submit.prevent>
      <!-- <label>
        Upload a file:
        <input type="file" @change="handleFile" />
      </label>
      <br /> -->
      <label>
        Owner id:
        <input type="number" v-model="ownerId" />
      </label>
      <br />
      <label>
        Container id:
        <input type="number" v-model="containerId" />
      </label>
      <br />
      <label>
        Message:
        <textarea v-model="message">{{ message }}</textarea>
      </label>

      <button @click="sendMessage">Send Message</button>
    </form>
    <p v-if="uploadId">Uploaded: {{ uploadId }}</p>
  </div>
</template>

<style scoped>
textarea {
  display: block;
  width: 80%;
  height: 5rem;
}
.done {
  text-decoration: line-through;
}
</style>
