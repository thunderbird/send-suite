<script setup>
import { ref } from "vue";
import SharedItems from "./SharedItems.vue";
import Message from "./Message.vue";

const currentUrl = ref(null);
function handleChoice(url) {
  currentUrl.value = url;
}
</script>

<template>
  <SharedItems @choose-url="handleChoice" />
  <Message :url="currentUrl" />
</template>

<style scoped>
button {
  font-weight: bold;
}
</style>
