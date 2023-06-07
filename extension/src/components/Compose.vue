<script setup>
import { ref } from "vue";
import Sender from "../lib/sender";
import Archive from "../lib/archive";
import { serverUrl } from "../lib/const";
const message = ref(null);
const groupId = ref(1);
const password = ref(null);

async function createItem(url, userId) {
  const createItemUrl = `${serverUrl}/api/items?type=MESSAGE`;
  const createItemFetchInfo = {
    mode: "cors",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url,
      sharedBy: userId,
    }),
  };
  const createItemResponse = await fetch(createItemUrl, createItemFetchInfo);

  if (!createItemResponse.ok) {
    console.log(
      "❌ Unable add create item in database",
      `Error: Unable to create db item for message.`
    );
    return;
  }
  const { item } = await createItemResponse.json();
  return item;
}

async function addItemToGroup(itemId, groupId) {
  const addItemToGroupUrl = `${serverUrl}/api/groups/${groupId}/items`;
  const addItemToGroupFetchInfo = {
    mode: "cors",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      itemId: itemId,
    }),
  };

  const addItemToGroupResponse = await fetch(
    addItemToGroupUrl,
    addItemToGroupFetchInfo
  );

  if (!addItemToGroupResponse.ok) {
    console.log(
      "❌ Unable add create item in database",
      `Error: Unable to create db item for item with id “${itemId}”.`
    );
  }
}

async function sendMessage() {
  console.log(message.value);
  const blob = new Blob([message.value], { type: "text/plain" });
  blob.name = `${new Date().getTime()}.txt`;
  const archive = new Archive([blob]);

  const sender = new Sender();
  const file = await sender.upload(archive, null, password.value);
  const item = await createItem(file.url, 1);
  if (item) {
    addItemToGroup(item.id, groupId.value);
    message.value = "";
    password.value = "";
  }
}
</script>

<template>
  <h2></h2>
  <textarea v-model="message"></textarea>
  <br />
  <label>
    Password (optional):
    <input v-model="password" />
  </label>
  <br />
  <label>
    Share to Group
    <input type="number" v-model="groupId" />
  </label>
  <br />
  <button @click="sendMessage">Send Message</button>
</template>

<style scoped>
textarea {
  width: 90%;
}
</style>
