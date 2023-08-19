<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AcceptEphemeral from '../components/AcceptEphemeral.vue';
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

onMounted(() => {
  // check storage for all of these:
  // - conversation id
  // if we have one, use it
  // - keys
  // - a user id
  // although, those last two should be already checked for...
});
</script>
<template>
  <AcceptEphemeral
    v-if="!conversationId"
    :hash="route.params.hash"
    @setConversationId="setConversationId"
  />
  <div v-if="conversationId">
    <MessageList :conversationId="conversationId" />
    <MessageSend :conversationId="conversationId" />
  </div>
</template>
