<script setup>
import { ref, onMounted, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AcceptEphemeral from '../components/AcceptEphemeral.vue';
import ConversationList from '../components/ConversationList.vue';
// import BurnButton from '../components/BurnButton.vue';
import MessageList from '../components/MessageList.vue';
import MessageSend from '../components/MessageSend.vue';

const route = useRoute();
const conversationId = ref(null);

function setConversationId(id) {
  conversationId.value = id;
  console.log(`we got a conversation id`);
  console.log(conversationId.value);
}
/*
- [X] read the hash from the URL (I think the router can give this to me)
- [X] pass hash to accept ephemeral (after updating accept ephemeral to receive a prop)
- [X] also give accept ephemeral a function that can set the conversation id (prob need to defineEmits on it)
- [X] you need to save-key/create-user/add-user-to-convo
*/
const { user } = inject('user');
watch(user, () => {
  // for now, sort the keys alphabetically to get the latest one
  const conversationIds = Object.keys(keychain.keys).sort();
  const mostRecentId = conversationIds[conversationIds.length - 1];
  if (mostRecentId) {
    setConversationId(mostRecentId);
  }
});

const keychain = inject('keychain');
keychain.addOnload(async () => {
  console.log(`🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉`);
  // get the keys
});

onMounted(() => {});
</script>
<template>
  <h1 className="text-3xl font-bold underline">Ephemeral Chat</h1>
  <div class="main w-full">
    <AcceptEphemeral
      v-if="route.params.hash"
      :hash="route.params.hash"
      @setConversationId="setConversationId"
    />
    <div v-else-if="conversationId" class="flex flex-row">
      <div class="w-full sm:w-1/2 md:w-1/3 mx-auto">
        <ConversationList @setConversationId="setConversationId" />
      </div>
      <div class="w-full md:w-2/3">
        <!-- <BurnButton :conversationId="conversationId" /> -->
        <MessageList :conversationId="conversationId" />
        <MessageSend :conversationId="conversationId" />
      </div>
    </div>
  </div>
</template>
