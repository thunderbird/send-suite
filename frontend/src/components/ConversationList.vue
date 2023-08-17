<script setup>
import { ref, onMounted, inject, watch } from 'vue';
import { generateRSAKeyPair, rsaToJwk } from '../lib/crypt';

const emits = defineEmits(['choose-conversation']);

const api = inject('api');
const { user } = inject('user');
const keychain = inject('keychain');
const conversations = ref([]);

watch(
  () => keychain,
  async () => {
    console.log(`ConversationList has the updated keychain`);
    // publicKey.value = await crypto.subtle.exportKey(
    //   'jwk',
    //   keychain.value.publicKey
    // );
  }
);

// then, call "up" to the common container to set a convo/container id
// which it should then pass down to the messageslist

function loadConversation(id) {
  console.log(`you want to load convo ${id}`);
  emits(`choose-conversation`, id);
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
    console.log(c);
  }
  conversations.value = cons;
}

async function createConversation() {
  console.log(`you want to create a convo`);
  const response = await api.createConversation(user.value.id);
  console.log(response);
  await keychain.createAndAddContainerKey(response.id);
  await keychain.store();
  loadAllConversations();
}

onMounted(async () => {
  console.log(api);
  loadAllConversations();
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
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="createConversation"
  >
    New Conversation
  </button>
  <ul>
    <li v-for="convo of conversations">
      <a href="#" @click.prevent="loadConversation(convo.id)">
        {{ convo.name }}
      </a>
    </li>
  </ul>
</template>

<style scoped></style>
