<script setup>
import { ref, onMounted } from 'vue';
import AcceptEphemeral from '../components/AcceptEphemeral.vue';
import MessageList from '../components/MessageList.vue';
import MessageSend from '../components/MessageSend.vue';

const conversationId = ref(null);
const hash = ref('');
/*
read the hash from the URL (I think the router can give this to me)
pass it to accept ephemeral (after updating accept ephemeral to receive a prop)
also give it a function that can set the conversation id (prob need to defineEmits on it)
*/
</script>
<template>
  <AcceptEphemeral />
  <div v-if="conversationId">
    <MessageList />
    <MessageSend />
  </div>
</template>
