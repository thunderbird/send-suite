<script setup>
import { ref, onMounted } from "vue";
import { serverUrl, ITEM_TYPES } from "../lib/const";

// Props are like inputs
// Emits are like outputs
// A component declares both.
// skewer in string form
const emits = defineEmits(["choose-url"]);
const props = defineProps({
  user: Object,
});

const sharedItems = ref([]);

async function getItems(userId) {
  const url = `${serverUrl}/api/users/${userId}/items?type=${ITEM_TYPES.MESSAGE}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    console.log(`Can't get items for this user`);
    return;
  }
  const items = await resp.json();
  console.log(`received message items:`);
  console.log(items);

  sharedItems.value = items;
  return;
}

onMounted(() => {
  if (props.user) {
    console.log(`getting items for user with id ${props.user.id}`);
    getItems(props.user.id);
  } else {
    console.log(`no props.user passed to MessageList`);
  }
});
</script>

<template>
  <h1>Your messages</h1>
  <button @click="getItems(props.user.id)">get new</button>
  <ul>
    <li v-for="{ url, createdAt, sharedByEmail } in sharedItems">
      <a href="#" @click.stop.prevent="emits(`choose-url`, url)"
        >{{ sharedByEmail }} @{{ new Date(createdAt) }}</a
      >
    </li>
  </ul>
</template>
