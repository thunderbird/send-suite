<script setup>
import { ref } from 'vue';
import ConversationList from '../components/ConversationList.vue';
import BurnButton from '../components/BurnButton.vue';
import MessageList from '../components/MessageList.vue';
import MessageSend from '../components/MessageSend.vue';
import AddPerson from '../components/AddPerson.vue';
import NewConversation from '../components/NewConversation.vue';
import InvitationList from '../components/InvitationList.vue';
import NewEphemeral from '../components/NewEphemeral.vue';

const conversationId = ref(null);

function setConversationId(id) {
  console.log(`Conversations view sees choice of ${id}`);
  conversationId.value = id;
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
        <template v-if="conversationId">
          <AddPerson :conversationId="conversationId" />
          <!-- consider only allowing NewEphemeral for fresh conversations -->
          <BurnButton :conversationId="conversationId" />
          <MessageList :conversationId="conversationId" />
          <MessageSend :conversationId="conversationId" />
        </template>
      </div>
    </div>
  </div>
</template>
