<script setup>
import { serverUrl, ITEM_TYPES } from "../lib/const";
import { ref, onMounted, inject } from "vue";

// Props are like inputs
// Emits are like outputs
// A component declares both.
// skewer in string form
const emits = defineEmits(["choose-url"]);
const user = inject("user");

const sharedItems = ref([]);

// This should be moved to api.js
async function getItems(userId) {
  const url = `${serverUrl}/api/users/${userId}/items?type=${ITEM_TYPES.FILE}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    console.log(`Can't get items for this user`);
    return;
  }
  const items = await resp.json();
  console.log(`received file items:`);
  console.log(items);

  sharedItems.value = items;
  return;
}

onMounted(() => {
  if (user) {
    console.log(`getting items for user with id ${user.id}`);
    getItems(user.id);
  } else {
    console.log(`no user passed to SharedFiles`);
  }
});
</script>

<template>
  <h4>Your files</h4>
  <button @click="getItems(user.id)">get new</button>
  <ul>
    <li v-for="{ url, createdAt, sharedByEmail } in sharedItems">
      <a href="#" @click.stop.prevent="emits(`choose-url`, url, 'file')"
        >{{ sharedByEmail }} @{{ new Date(createdAt) }}</a
      >
    </li>
  </ul>
</template>
