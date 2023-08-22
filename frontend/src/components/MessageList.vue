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

const { user } = inject('user');
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
  if (!container?.items) {
    return;
  }
  // console.log(container);
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
  }, 500);
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

      <div class="chat-message mb-2" v-for="m in messageList" :key="m.id">
        <template v-if="m.sender.email === user.email">
          <div class="flex items-end justify-end">
            <div
              class="flex flex-col space-y-2 text-xs max-w-xs mx-2 order-1 items-end"
            >
              <div>
                <span
                  class="px-4 py-2 rounded-lg inline-block rounded-br-none bg-blue-600 text-white"
                >
                  {{ m.messageText }}
                </span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1590031905470-a1a1feacbb0b?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=3&amp;w=144&amp;h=144"
              alt="My profile"
              class="w-6 h-6 rounded-full order-2"
            />
          </div>
        </template>
        <template v-else>
          <div class="flex items-end">
            <div
              class="flex flex-col space-y-2 text-xs max-w-xs mx-2 order-2 items-start"
            >
              <div>
                <span
                  class="px-4 py-2 rounded-lg inline-block rounded-bl-none bg-gray-300 text-gray-600"
                >
                  {{ m.messageText }}
                </span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1549078642-b2ba4bda0cdb?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=3&amp;w=144&amp;h=144"
              alt="My profile"
              class="w-6 h-6 rounded-full order-1"
            />
          </div>
        </template>
      </div>

      <!-- <ul>
        <li v-for="m in messageList" :key="m.id">
          {{ m.sender.email }} {{ m.messageText }}
        </li>
      </ul> -->
    </div>
  </div>
</template>

<style scoped></style>
