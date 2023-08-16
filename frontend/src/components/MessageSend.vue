<script setup>
import { ref, inject } from 'vue';
import { upload } from '../lib/filesync';
import { blobStream } from '../lib/streams';

const props = defineProps({
  conversationId: Number,
});

const api = inject('api');
const keychain = inject('keychain');
console.log(keychain.value);

const message = ref('hello this is the default message');

async function sendBlob(blob) {
  console.log(`want to send blob of size ${blob.size}`);
  console.log(blob);

  const keychainObj = keychain.value;
  const realKey = keychainObj.get(props.conversationId);
  if (!realKey) {
    return;
  }
  const stream = blobStream(blob);
  const result = await upload(stream, realKey);
  console.log(result);
  return result.id;
}

async function sendMessage() {
  if (!props.conversationId) {
    console.log(`cannot send message - no conversation selected`);
    return;
  }

  const filename = `${new Date().getTime()}.txt`;
  const blob = new Blob([message.value], {
    type: 'text/plain',
  });
  blob.name = filename;

  const id = await sendBlob(blob);
  if (!id) {
    console.log(`could not upload`);
    return;
  }

  const uploadResp = await api.createUpload(id, blob.size, 1);
  console.log(uploadResp);

  if (id !== uploadResp.id) {
    debugger;
  }
  const itemResp = await api.createItemInContainer(
    id,
    props.conversationId,
    filename,
    'MESSAGE'
  );
  console.log(`🎉 here it is...`);
  console.log(itemResp);
}
</script>

<template>
  <div v-if="props.conversationId">
    <form @submit.prevent>
      <label>
        Message:
        <textarea v-model="message">{{ message }}</textarea>
      </label>

      <button @click="sendMessage">Send Message</button>
    </form>
  </div>
</template>
