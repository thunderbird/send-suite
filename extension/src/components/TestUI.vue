<script setup>
import { ref } from "vue";
import MessageList from "./MessageList.vue";
import Message from "./Message.vue";
// import Compose from "./Compose.vue";

const currentUrl = ref(null);
function handleChoice(url) {
  currentUrl.value = url;
}
</script>

<template>
  <!-- <Compose /> -->
  <MessageList @choose-url="handleChoice" />
  <Message :url="currentUrl" />
</template>

<style scoped>
button {
  font-weight: bold;
}
</style>
