<script setup>
import { ref, watch, onMounted, inject } from 'vue';
import { download } from '../lib/filesync';
import BurnButton from './BurnButton.vue';

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
const onNewMessage = inject('onNewMessage');
const messageList = ref();
const messageContainer = ref(null);

const downloadKeyMap = {};

async function downloadContent(id, aesKey, filename, isMessage = true) {
  if (!id) {
    console.log(`no id`);
    return;
  }
  const { size, type } = await api.getUploadMetadata(id);

  if (!size) {
    console.log(`no size`);
    return;
  }

  if (!aesKey) {
    console.log(`no aes key`);
    return;
  }

  if (isMessage) {
    // console.log(aesKey);
    const plaintextString = await download(id, size, aesKey);
    // console.log(plaintextString);
    return plaintextString;
  }
  // download the file, specifying the id, size, aesKey, isMessage=false, filename, and (mime)type
  await download(id, size, aesKey, false, filename, type);
}

async function getContainerWithItems(id) {
  const container = await api.getContainerWithItems(id);
  if (!container?.items) {
    return;
  }

  let wrappingKey;
  try {
    wrappingKey = await keychain.get(props.conversationId);
  } catch (e) {
    console.log(`cannot send message - no key for conversation`);
    return;
  }

  const contentArray = await Promise.all(
    container.items.map(async ({ uploadId, type, wrappedKey }) => ({
      id: uploadId,
      type,
      aesKey: await keychain.container.unwrapContentKey(
        wrappedKey,
        wrappingKey
      ),
    }))
  );

  let items = await fillMessageList(contentArray);
  const messages = items.map((item, i) => {
    return {
      messageText: item.messageText,
      id: item.id,
      sender: container.items[i].upload.owner,
      type: item.type,
      name: container.items[i].name,
    };
  });

  messageList.value = messages;

  // if (messageList.value) {
  //   messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  // }
}

async function fillMessageList(contentArray) {
  const messages = await Promise.all(
    contentArray.map(async ({ id, type, aesKey }) => {
      if (type === 'MESSAGE') {
        return {
          messageText: await downloadContent(id, aesKey),
          id,
          type,
        };
      } else if (type === 'FILE') {
        console.log(
          `not putting file in messages array, but adding download key in map`
        );
        downloadKeyMap[id] = aesKey;
        return {
          messageText: `bad mime type ${id}`,
          id,
          type,
        };
      }
    })
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
  onNewMessage((id) => {
    console.log(`got new message notification for ${id}`);
    if (parseInt(id) === parseInt(props.conversationId)) {
      console.log(`it matches, so I'm updating the container`);
      getContainerWithItems(props.conversationId);
    }
  });
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
  <!-- <p>Conversation Id {{ props.conversationId }}</p> -->
  <div v-if="props.conversationId">
    <div
      class="flex sm:items-center justify-between py-3 border-b-2 border-gray-200 pr-3"
    >
      <div class="relative flex items-center space-x-4">
        <!-- <div class="relative">
          <span class="absolute text-green-500 right-0 bottom-0">
            <svg width="20" height="20">
              <circle cx="8" cy="8" r="8" fill="currentColor"></circle>
            </svg>
          </span>
          <img
            src="https://images.unsplash.com/photo-1549078642-b2ba4bda0cdb?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=3&amp;w=144&amp;h=144"
            alt=""
            class="w-10 sm:w-16 h-10 sm:h-16 rounded-full"
          />
        </div> -->
        <!-- <div class="flex flex-col leading-tight">
          <div class="text-2xl mt-1 flex items-center">
            <span class="text-gray-700 mr-3">Anderson Vanhron</span>
          </div>
          <span class="text-lg text-gray-600">Junior Developer</span>
        </div> -->
      </div>
      <div class="flex items-center space-x-2">
        <!-- <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="h-6 w-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </button> -->
        <!-- <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="h-6 w-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            ></path>
          </svg>
        </button> -->
        <BurnButton :conversationId="conversationId" />
      </div>
    </div>
    <div
      v-if="messageList"
      id="messages"
      ref="messageContainer"
      class="flex flex-col space-y-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
    >
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
                  <span v-if="m.type === 'MESSAGE'">
                    {{ m.messageText }}
                  </span>
                  <span v-else-if="m.type === 'FILE'">
                    <a
                      href="#"
                      @click.prevent="
                        downloadContent(
                          m.id,
                          downloadKeyMap[m.id],
                          m.name,
                          false
                        )
                      "
                      >⬇️ {{ m.name }}</a
                    >
                  </span>
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
                  <span v-if="m.type === 'MESSAGE'">
                    {{ m.messageText }}
                  </span>
                  <span v-else-if="m.type === 'FILE'">
                    <a
                      href="#"
                      @click.prevent="
                        downloadContent(
                          m.id,
                          downloadKeyMap[m.id],
                          m.name,
                          false
                        )
                      "
                      >⬇️ {{ m.name }}</a
                    >
                  </span>
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
