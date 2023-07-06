<script setup>
import { serverUrl, ITEM_TYPES } from "../lib/const";
import { ref, onMounted, inject } from "vue";

// Props are like inputs
// Emits are like outputs
// A component declares both.
// skewer in string form
const emits = defineEmits(["choose-url"]);
const { user } = inject("user");
const { api } = inject("api");

const files = ref([]);

// This should be moved to api.js
async function getFiles(userId) {
  if (user.value && api.value) {
    console.log(`getting items for user with id ${user?.value.id}`);
    files.value = await api.value.getFiles(user.value.id);
  } else {
    console.log(`no user passed to SharedFiles`);
  }
}

onMounted(() => {
  getFiles();
});
</script>

<template>
  <h4>Your files</h4>
  <button @click="getFiles">get new</button>
  <ul>
    <li v-for="{ url, createdAt, sharedByEmail } in files">
      <a href="#" @click.stop.prevent="emits(`choose-url`, url, 'file')"
        >{{ sharedByEmail }} @{{ new Date(createdAt) }}</a
      >
    </li>
  </ul>
</template>
