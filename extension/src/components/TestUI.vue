<script setup>
import { ref } from "vue";
import MessageList from "./MessageList.vue";
import Message from "./Message.vue";
import SharedFiles from "./SharedFiles.vue";
import Compose from "./Compose.vue";

const currentMessageUrl = ref(null);
function handleMessageChoice(url) {
  currentMessageUrl.value = url;
}
const currentFileUrl = ref(null);
function handleFileChoice(url) {
  currentFileUrl.value = url;
}
</script>

<template>
  <Compose />
  <MessageList @choose-url="handleMessageChoice" />
  <Message :url="currentMessageUrl" />
  <SharedFiles @choose-url="handleFileChoice" />
  <div>File you clicked for download: {{ currentFileUrl }}</div>
</template>

<style scoped>
button {
  font-weight: bold;
}
</style>
