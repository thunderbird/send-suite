<script setup>
import { ref, onMounted, inject } from "vue";

// Props are like inputs
// Emits are like outputs
// A component declares both.
// skewer in string form
const emits = defineEmits(["choose-url"]);
const { user } = inject("user");
const { api } = inject("api");

const messages = ref([]);

async function getMessages() {
  if (user.value && api.value) {
    console.log(`getting items for user with id ${user?.value.id}`);
    api.value.getMessages(user.value.id);
  } else {
    console.log(`no user passed to MessageList`);
  }
}

onMounted(() => {
  getMessages();
});
</script>

<template>
  <h4>Your messages {{ user.id }}</h4>
  <button @click="getMessages">get new</button>
  <ul>
    <li v-for="{ url, createdAt, sharedByEmail } in messages">
      <a href="#" @click.stop.prevent="emits(`choose-url`, url, 'message')"
        >{{ sharedByEmail }} @{{ new Date(createdAt) }}</a
      >
    </li>
  </ul>
</template>
