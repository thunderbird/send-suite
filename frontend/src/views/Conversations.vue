<script setup>
import { ref } from 'vue';
import ConversationList from '../components/ConversationList.vue';
import MessageList from '../components/MessageList.vue';
import MessageSend from '../components/MessageSend.vue';
import AddPerson from '../components/AddPerson.vue';
import InvitationList from '../components/InvitationList.vue';

const currentConversation = ref(null);

function handleChoice(conversationId) {
  console.log(`Conversations view sees choice of ${conversationId}`);
  currentConversation.value = conversationId;
}
</script>

<template>
  <InvitationList />
  <ConversationList @choose-conversation="handleChoice" />
  <AddPerson :conversationId="currentConversation" />
  <MessageList :conversationId="currentConversation" />
  <MessageSend :conversationId="currentConversation" />
</template>
