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
const messageSocket = inject('messageSocket');

console.log(keychain.value);

const message = ref('');
const fileBlob = ref(null);
const fileInput = ref(null);
const msgInput = ref(null);

async function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const buffer = reader.result;
    fileBlob.value = new Blob([buffer], { type: file.type });
    fileBlob.value.name = file.name;
  };
  reader.readAsArrayBuffer(file);
  message.value = file.name;
  msgInput.value.disabled = true;
}

async function sendBlob(blob, aesKey) {
  console.log(`want to send blob of size ${blob.size}`);
  console.log(blob);

  // const aesKey = await keychain.get(props.conversationId);
  // if (!aesKey) {
  //   return;
  // }
  const stream = blobStream(blob);
  const result = await upload(stream, aesKey);
  console.log(result);
  return result.id;
}

async function sendMessage(isText = true) {
  if (!props.conversationId) {
    console.log(`cannot send message - no conversation selected`);
    return;
  }
  let filename = `${new Date().getTime()}.txt`;
  let blob;
  if (isText) {
    blob = new Blob([message.value], {
      type: 'text/plain',
    });
    blob.name = filename;
  } else {
    blob = fileBlob.value;
    filename = blob.name;
  }

  // generate new AES key for this upload
  // const aesKey = await

  const id = await sendBlob(blob);
  if (!id) {
    console.log(`could not upload`);
    return;
  }
  console.log(`🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀`);
  console.log(blob.type);
  const uploadResp = await api.createUpload(
    id,
    blob.size,
    user.value.id,
    blob.type
  );
  console.log(uploadResp);

  if (id !== uploadResp.id) {
    debugger;
  }
  const itemResp = await api.createItemInContainer(
    id,
    props.conversationId,
    filename,
    isText ? 'MESSAGE' : 'FILE'
  );
  console.log(`🎉 here it is...`);
  console.log(itemResp);
  message.value = '';
  fileBlob.value = null;
  msgInput.value.disabled = false;
  msgInput.value.focus();
  messageSocket.value.send(
    JSON.stringify({
      type: 'newMessage',
      conversationId: props.conversationId,
    })
  );
}
</script>

<template>
  <form @submit.prevent>
    <input type="file" @change="handleFile" class="hidden" ref="fileInput" />
    <div v-if="props.conversationId" class="sticky bottom-0">
      <div class="border-t-2 border-gray-200 px-4 pt-4 mb-2 sm:mb-0 bg-white">
        <div class="relative flex">
          <span class="absolute inset-y-0 flex items-center">
            <!-- <button
            type="button"
            class="inline-flex items-center justify-center rounded-full h-12 w-12 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              class="h-6 w-6 text-gray-600"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              ></path>
            </svg>
          </button> -->
          </span>
          <input
            type="text"
            placeholder="Write your message here"
            class="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-3 bg-gray-200 rounded-md py-3"
            v-model="message"
            ref="msgInput"
          />
          <div class="absolute right-0 items-center inset-y-0 hidden sm:flex">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
              @click="fileInput.click()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                class="h-6 w-6 text-gray-600"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                ></path>
              </svg>
            </button>
            <!-- <button
            type="button"
            class="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              class="h-6 w-6 text-gray-600"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              ></path>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
          </button> -->
            <!-- <button
            type="button"
            class="inline-flex items-center justify-center rounded-full h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              class="h-6 w-6 text-gray-600"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </button> -->
            <button
              v-if="fileBlob"
              type="submit"
              class="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
              @click="sendMessage(false)"
            >
              <span class="font-bold">Upload</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-6 w-6 ml-2 transform rotate-90"
              >
                <path
                  d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                ></path>
              </svg>
            </button>
            <button
              v-else
              type="submit"
              class="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
              @click="sendMessage(true)"
            >
              <span class="font-bold">Send</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-6 w-6 ml-2 transform rotate-90"
              >
                <path
                  d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <!-- <form @submit.prevent>
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
    </form> -->
    </div>
  </form>
</template>
