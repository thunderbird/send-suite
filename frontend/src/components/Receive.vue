<script setup>
import { ref } from 'vue';
import { download } from '../lib/filesync';
// import { streamToArrayBuffer } from '../lib/utils';
// import { blobStream } from '../lib/streams';
import { loadKeyFromStorage } from '../lib/crypt';
import { ApiConnection } from '../lib/api';

const fileId = ref('');
const message = ref('here is where the message will appear');
const containerId = ref(1);
const messageList = ref();

const api = new ApiConnection('https://localhost:8088');

async function downloadMessage(id = fileId.value) {
  // debugger;
  // console.log(fileId.value);
  // if (!fileId.value) {
  //   return;
  // }
  // const id = fileId.value;
  if (!id) {
    return;
  }
  const size = await api.getUploadSize(id);

  if (!size) {
    return;
  }

  const realKey = await loadKeyFromStorage();
  let exported = await window.crypto.subtle.exportKey('raw', realKey);
  exported = new Uint8Array(exported);
  const plaintextString = await download(id, size, exported);
  console.log(plaintextString);
  // message.value = plaintextString;
  return plaintextString;
}

async function getContainerWithItems() {
  const container = await api.getContainerWithItems(containerId.value);
  console.log(`got items`);
  console.log(container.items);
  // messageList.value = container.items;
  // console.log(messageList.value);
  await fillMessageList(container.items.map(({ uploadId }) => uploadId));
}

async function fillMessageList(uploadIds) {
  const messages = await Promise.all(
    uploadIds.map((id) => downloadMessage(id))
  );
  console.log(`got messages`);
  console.log(messages);
  messageList.value = messages;
}
</script>

<template>
  <div>
    <ol>
      <li>add form element for container id</li>
      <li>retrieve private key for folder from storage</li>
      <li>download/decrypt all items in container</li>
    </ol>
    <form @submit.prevent="getContainerWithItems">
      <label>
        Container id:
        <input type="number" v-model="containerId" />
      </label>
      <br />
      <input type="submit" value="get items for container" />
    </form>
    <div v-if="messageList">
      <p>you've got mail</p>
      <ul>
        <li v-for="messageText in messageList">
          {{ messageText }}
        </li>
      </ul>
    </div>
    <form @submit.prevent>
      <label>
        Download a single message:
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
