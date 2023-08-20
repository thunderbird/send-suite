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
  <div class="w-full">
    <NewEphemeral />
    <InvitationList />
    <NewConversation />
    <div class="flex flex-row border-double border-4 border-sky-500">
      <div
        class="w-full sm:w-1/2 md:w-1/3 mx-auto border-solid border-2 border-red-500"
      >
        <ConversationList @setConversationId="setConversationId" />
      </div>
      <div class="w-full md:w-2/3 border-solid border-2 border-red-500">
        <template v-if="currentConversation">
          <AddPerson :conversationId="currentConversation" />
          <!-- consider only allowing NewEphemeral for fresh conversations -->
          <MessageList :conversationId="currentConversation" />
          <MessageSend :conversationId="currentConversation" />
        </template>
      </div>
    </div>
  </div>
</template>
