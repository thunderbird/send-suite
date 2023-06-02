<script setup>
import { serverUrl } from "../lib/const";
import { ref, onMounted } from "vue";

// Props are like inputs
// Emits are like outputs
// A component declares both.
// skewer in string form
const emits = defineEmits(["choose-url"]);

const sharedItems = ref([]);
const groupId = 1;

onMounted(() => {
  console.log(serverUrl);
});

async function getItems() {
  const url = `${serverUrl}/api/groups/${groupId}/items`;

  const resp = await fetch(url);
  if (!resp.ok) {
    console.log(`Can't get items for group`);
    return;
  }
  const { items } = await resp.json();
  console.log(`items retrieved from `);
  console.log(items);
  sharedItems.value = items.map((i) => i.item);
  return;
}
</script>

<template>
  <h1>hi. your shared items will appear here</h1>
  <ul>
    <li v-for="{ url } in sharedItems">
      <a href="#" @click.stop="emits(`choose-url`, url)">{{ url }}</a>
    </li>
  </ul>
  <button @click="getItems">Get Items</button>
  <!-- <div v-if="currentUrl">You clicked {{ currentUrl }}</div> -->
</template>
