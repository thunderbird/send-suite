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
  await keychain.newKeyForContainer(response.id);
  // await keychain.store();
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
  <button class="btn-primary" @click="createConversation">
    New Conversation
  </button>

  <br />
</template>
