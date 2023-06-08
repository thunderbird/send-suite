<script setup>
import { ref } from "vue";
import MessageList from "./MessageList.vue";
import MessageViewer from "./MessageViewer.vue";
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
  <MessageViewer :url="currentMessageUrl" />
  <SharedFiles @choose-url="handleFileChoice" />
  <MessageViewer :url="currentFileUrl" />
</template>

<style scoped>
button {
  font-weight: bold;
}
</style>
