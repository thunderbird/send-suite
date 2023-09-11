<script setup>
import { ref } from 'vue';
import ConversationList from '../components/ConversationList.vue';
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
    <InvitationList />
    <NewConversation />
    <NewEphemeral />
    <div class="flex flex-row border-2 border-grey-500">
      <div class="w-full sm:w-1/2 md:w-1/3 mx-auto">
        <ConversationList @setConversationId="setConversationId" />
      </div>
      <div class="h-fit w-full md:w-2/3">
        <template v-if="conversationId">
          <!-- <AddPerson :conversationId="conversationId" /> -->
          <!-- consider only allowing NewEphemeral for fresh conversations -->
          <!-- <BurnButton :conversationId="conversationId" /> -->
          <!-- <MessageList :conversationId="conversationId" /> -->
          <MessageSend :conversationId="conversationId" />
        </template>
      </div>
    </div>
  </div>
</template>
