<script setup>
import { ref, onMounted } from "vue";
import { serverUrl, ITEM_TYPES } from "../lib/const";
import { get, set } from "../lib/sync";
import { keyFor } from "../lib/const";

// Props are like inputs
// Emits are like outputs
// A component declares both.
// skewer in string form
const emits = defineEmits(["choose-url"]);

const sharedItems = ref([]);
const groupId = 2;

async function getItems() {
  const url = `${serverUrl}/api/groups/${groupId}/items?type=${ITEM_TYPES.MESSAGE}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    console.log(`Can't get items for group`);
    return;
  }
  const items = await resp.json();
  console.log(`items retrieved from `);
  console.log(items);
  sharedItems.value = items; //items.map((i) => i.item);
  return;
}

onMounted(() => {
  console.log(serverUrl);
  console.log("Checking storage for user.");
  const obj = get(keyFor("user"));
  if (obj) {
    const { email, id } = obj;
    console.log(`Loaded user ${email} with id ${id}`);
    // emailAddress.value = email;
  }
  getItems();
});
</script>

<template>
  <h1>Your messages</h1>
  <button @click="getItems">get new</button>
  <ul>
    <li v-for="{ url } in sharedItems">
      <a href="#" @click.stop="emits(`choose-url`, url)">{{ url }}</a>
    </li>
  </ul>
</template>
