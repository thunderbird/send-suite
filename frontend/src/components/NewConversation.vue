<script setup>
import { inject } from 'vue';

const api = inject('api');
const { user } = inject('user');
const keychain = inject('keychain');
const messageSocket = inject('messageSocket');

async function createConversation() {
  console.log(`you want to create a convo`);
  const response = await api.createConversation(user.value.id);
  console.log(response);
  // await keychain.createAndAddContainerKey(1);
  await keychain.createAndAddContainerKey(response.id);
  await keychain.store();
  // loadAllConversations();
  messageSocket.value.send(
    JSON.stringify({
      type: 'newChat',
      // conversationId: props.conversationId,
    })
  );
}
</script>
<template>
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="createConversation"
  >
    New Conversation
  </button>

  <br />
</template>
