<script setup>
import { ref, watch, onMounted, inject } from 'vue';
import { download } from '../lib/filesync';
// onmounted, get all items for this convo/container
// get all participants
//  - you probably need to write a function for this
// add a button to add a participant

const props = defineProps({
  id: Number,
});

const api = inject('api');
const keyStore = inject('keyStore');
const messageList = ref();

async function downloadMessage(id) {
  if (!id) {
    console.log(`no id`);
    return;
  }
  const size = await api.getUploadSize(id);

  if (!size) {
    console.log(`no size`);
    return;
  }

  const keyStoreObj = keyStore.value;
  const realKey = keyStoreObj['1'];
  if (!realKey) {
    console.log(`no key`);
    return;
  }
  console.log(realKey);
  const plaintextString = await download(id, size, realKey);
  console.log(plaintextString);
  return plaintextString;
}

async function getContainerWithItems(id) {
  const container = await api.getContainerWithItems(id);
  console.log(`got items`);
  console.log(container.items);
  const uploadIds = container.items.map(({ uploadId }) => uploadId);
  console.log(`got uploadIds`);
  console.log(uploadIds);
  await fillMessageList(uploadIds);
}

async function fillMessageList(uploadIds) {
  const messages = await Promise.all(
    uploadIds.map((id) => downloadMessage(id))
  );
  console.log(`got messages`);
  console.log(messages);
  messageList.value = messages;
}

onMounted(() => {
  if (!props.id) {
    return;
  }
  getContainerWithItems(props.id);
});

watch(
  () => props.id,
  () => {
    console.log(`props.id: ${props.id}`);
    if (!props.id) {
      return;
    }
    console.log(`🤡🤡🤡🤡🤡🤡🤡🤡🤡`);
    getContainerWithItems(props.id);
  }
);
</script>
<template>
  <p>Conversation Id {{ props.id }}</p>
  <div v-if="props.id">
    <div>
      <button>Add Person</button>
    </div>
    <div v-if="messageList">
      <p>you've got mail</p>
      <ul>
        <li v-for="messageText in messageList">
          {{ messageText }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped></style>
