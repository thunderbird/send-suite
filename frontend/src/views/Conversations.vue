<script setup>
import { ref } from 'vue';
import ConversationList from '../components/ConversationList.vue';
import MessageList from '../components/MessageList.vue';
import MessageSend from '../components/MessageSend.vue';
import AddPerson from '../components/AddPerson.vue';
import NewConversation from '../components/NewConversation.vue';
import InvitationList from '../components/InvitationList.vue';
import NewEphemeral from '../components/NewEphemeral.vue';

const currentConversation = ref(null);

function setConversationId(conversationId) {
  console.log(`Conversations view sees choice of ${conversationId}`);
  currentConversation.value = conversationId;
}
</script>

<template>
  <NewEphemeral />
  <InvitationList />
  <NewConversation />
  <ConversationList @setConversationId="setConversationId" />
  <div v-if="currentConversation">
    <AddPerson :conversationId="currentConversation" />
    <!-- consider only allowing NewEphemeral for fresh conversations -->
    <MessageList :conversationId="currentConversation" />
    <MessageSend :conversationId="currentConversation" />
  </div>
</template>
