<script setup>
import { ref, inject } from 'vue';
import { upload } from '../lib/filesync';
import { blobStream } from '../lib/streams';

const props = defineProps({
  conversationId: Number,
});

const api = inject('api');
const { user } = inject('user');
const keychain = inject('keychain');
console.log(keychain.value);

const message = ref('');

async function sendBlob(blob) {
  console.log(`want to send blob of size ${blob.size}`);
  console.log(blob);

  const aesKey = await keychain.get(props.conversationId);
  if (!aesKey) {
    return;
  }
  const stream = blobStream(blob);
  const result = await upload(stream, aesKey);
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

  const uploadResp = await api.createUpload(id, blob.size, user.value.id);
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
  message.value = '';
}
</script>

<template>
  <div v-if="props.conversationId">
    <form @submit.prevent>
      <label>
        Message:
        <textarea v-model="message">{{ message }}</textarea>
      </label>

      <button
        class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        @click="sendMessage"
      >
        Send Message
      </button>
    </form>
  </div>
</template>
