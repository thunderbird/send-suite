<script setup>
import { ref, onMounted } from "vue";
import MessageList from "./MessageList.vue";
import MessageViewer from "./MessageViewer.vue";
import SharedFiles from "./SharedFiles.vue";
import Compose from "./Compose.vue";
import { loadUser } from "../lib/sync";

const user = ref(null);
onMounted(() => {
  console.log("Checking storage for user.");
  try {
    user.value = loadUser();
    console.log(`Loaded user ${user.value.email} with id ${user.value.id}`);
  } catch (error) {
    console.log(error);
  }
});

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
  <div v-if="user">
    <h1>Logged in as {{ user.email }}</h1>
    <Compose :user="user" />
    <MessageList @choose-url="handleMessageChoice" :user="user" />
    <MessageViewer :url="currentMessageUrl" />
    <SharedFiles @choose-url="handleFileChoice" :user="user" />
    <MessageViewer :url="currentFileUrl" />
  </div>
</template>

<style scoped>
button {
  font-weight: bold;
}
</style>
