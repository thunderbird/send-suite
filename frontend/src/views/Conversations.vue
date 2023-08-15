<script setup>
import { ref } from 'vue';
import ConversationList from '../components/ConversationList.vue';
import MessageList from '../components/MessageList.vue';
import MessageSend from '../components/MessageSend.vue';

const currentConversation = ref(null);

function handleChoice(conversationId) {
  console.log(`Conversations view sees choice of ${conversationId}`);
  currentConversation.value = conversationId;
}
</script>

<template>
  <ConversationList @choose-conversation="handleChoice" />
  <MessageList :id="currentConversation" />
  <MessageSend :id="currentConversation" />
</template>
