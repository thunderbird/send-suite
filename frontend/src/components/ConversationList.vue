<script setup>
import { ref, onMounted, inject, watch } from 'vue';
// import { generateRSAKeyPair, rsaToJwk } from '../lib/crypt';

const emit = defineEmits(['setConversationId']);

const api = inject('api');
const onNewMessage = inject('onNewMessage');
const onNewChat = inject('onNewChat');

const { user } = inject('user');
const conversations = ref([]);

// then, call "up" to the common container to set a convo/container id
// which it should then pass down to the messageslist

function loadConversation(id) {
  console.log(`you want to load convo ${id}`);
  emit(`setConversationId`, id);
}

async function loadAllConversations() {
  if (!user.value.id) {
    console.log(`no valid user id`);
    return;
  }
  const cons = await api.getAllConversations(user.value.id);
  if (!cons) {
    return;
  }
  for (let c of cons) {
    c.mostRecent = c?.items[c.items.length - 1];
    console.log(c);
  }
  console.log(cons);
  conversations.value = cons;
}

watch(user, async () => {
  if (user.value.id !== 0) {
    console.log(api);
    loadAllConversations();
  }
});
onNewChat(() => {
  loadAllConversations();
});

onMounted(async () => {
  console.log(api);
  loadAllConversations();

  onNewMessage((id) => {
    // debugger;
    console.log(`got new message notification for ${id}`);
    loadAllConversations();
  });
});
</script>

<template>
  <!-- <div
    class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4"
  >
    <div class="shrink-0">
      <img class="h-12 w-12" src="/img/logo.svg" alt="ChitChat Logo" />
    </div>
    <div>
      <div class="text-xl font-medium text-black">ChitChat</div>
      <p class="text-slate-500">You have a new message!</p>
    </div>
  </div> -->

  <div
    class="flex sm:items-center justify-between py-3 border-b-2 border-gray-200 pr-3"
  >
    <div class="flex items-center pl-3">
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
      <button
        class="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
        @click="loadAllConversations"
      >
        🔃
      </button>
    </div>
  </div>
  <div class="border-r border-gray-300 lg:col-span-1">
    <div class="mx-3 my-3">
      <div class="relative text-gray-600">
        <span class="absolute inset-y-0 left-0 flex items-center pl-2">
          <svg
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            class="w-6 h-6 text-gray-300"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </span>
        <input
          type="search"
          class="block w-full py-2 pl-10 bg-gray-100 rounded outline-none"
          name="search"
          placeholder="Search"
          required
        />
      </div>
    </div>

    <h2 class="my-2 mb-2 ml-2 text-lg text-gray-600">Chats</h2>
    <a
      v-for="convo of conversations"
      class="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none"
      @click.prevent="loadConversation(convo.id)"
    >
      <img
        class="object-cover w-10 h-10 rounded-full"
        src="https://cdn.pixabay.com/photo/2018/09/12/12/14/man-3672010__340.jpg"
        alt="username"
      />
      <div class="w-full pb-2">
        <div class="flex justify-between">
          <span class="block ml-2 font-semibold text-gray-600">
            {{ convo?.mostRecent?.upload?.owner?.email || '' }}
          </span>
          <!-- <span class="block ml-2 text-sm text-gray-600">11 minutes</span> -->
        </div>
        <span class="block ml-2 text-sm text-gray-600">{{ convo.name }}</span>
      </div>
    </a>
  </div>
  <!-- <ul>
    <li v-for="convo of conversations">
      <a href="#" @click.prevent="loadConversation(convo.id)">
        {{ convo.name }}
      </a>
    </li>
  </ul> -->
</template>

<style scoped></style>
