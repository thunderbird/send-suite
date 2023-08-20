<script setup>
import { ref, watch, onMounted, inject } from 'vue';
import { download } from '../lib/filesync';
// onmounted, get all items for this convo/container
// get all participants
//  - you probably need to write a function for this
// add a button to add a participant

const props = defineProps({
  conversationId: Number,
});

const api = inject('api');
const keychain = inject('keychain');
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

  const aesKey = await keychain.get(props.conversationId);
  if (!aesKey) {
    console.log(`no keyset in keychain`);
    return;
  }

  if (!aesKey) {
    console.log(`no aes key`);
    return;
  }
  // console.log(aesKey);
  const plaintextString = await download(id, size, aesKey);
  // console.log(plaintextString);
  return plaintextString;
}

async function getContainerWithItems(id) {
  const container = await api.getContainerWithItems(id);
  console.log(container);
  // console.log(`got items`);
  // console.log(container.items);
  const uploadIds = container.items.map(({ uploadId }) => uploadId);
  // console.log(`got uploadIds`);
  // console.log(uploadIds);
  let items = await fillMessageList(uploadIds);
  const messages = items.map((item, i) => {
    // debugger;

    return {
      messageText: item.messageText,
      id: item.id,
      sender: container.items[i].upload.owner,
    };
  });

  messageList.value = messages;
}

async function fillMessageList(uploadIds) {
  const messages = await Promise.all(
    uploadIds.map(async (id) => ({
      messageText: await downloadMessage(id),
      id,
    }))
  );
  // console.log(`got messages`);
  // console.log(messages);
  return messages;
}

onMounted(() => {
  if (!props.conversationId) {
    return;
  }
  getContainerWithItems(props.conversationId);
  setInterval(() => {
    getContainerWithItems(props.conversationId);
  }, 5000);
});

watch(
  () => props.conversationId,
  () => {
    console.log(`props.conversationId: ${props.conversationId}`);
    if (!props.conversationId) {
      return;
    }
    console.log(`🤡🤡🤡🤡🤡🤡🤡🤡🤡`);
    getContainerWithItems(props.conversationId);
  }
);
</script>
<template>
  <p>Conversation Id {{ props.conversationId }}</p>
  <div v-if="props.conversationId">
    <div v-if="messageList">
      <p>Messages:</p>
      <ul>
        <li v-for="m in messageList" :key="m.id">
          {{ m.sender.email }} {{ m.messageText }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped></style>
