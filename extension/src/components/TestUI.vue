<script setup>
import { ref, onMounted } from "vue";
import SharedItems from "./SharedItems.vue";
import Message from "./Message.vue";

const count = ref(0);
const currentUrl = ref(null);

function increment() {
  count.value++;
  console.log(`looks like you want to increment to ${count.value}`);
}

function handleChoice(url) {
  currentUrl.value = url;
}

onMounted(() => {
  console.log(`The initial count is ${count.value}.`);
});
</script>

<template>
  <button @click="increment">Count is {{ count }}</button>
  <SharedItems @choose-url="handleChoice"></SharedItems>
  <Message :url="currentUrl"></Message>
</template>

<style scoped>
button {
  font-weight: bold;
}
</style>
