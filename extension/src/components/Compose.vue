<script setup>
import { ref, onMounted } from "vue";
import Sender from "../lib/sender";
import Archive from "../lib/archive";
import { serverUrl } from "../lib/const";
import { get, set } from "../lib/sync";
import { keyFor } from "../lib/const";
const message = ref(null);
const groupId = ref(1);
const userId = ref(0);
const password = ref(null);
const fileBlob = ref(null);
const isFile = ref(false);

async function createItem(url, userId) {
  const itemType = isFile.value ? "FILE" : "MESSAGE";
  const createItemUrl = `${serverUrl}/api/items?type=${itemType}`;
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

async function doSend(blob) {
  const archive = new Archive([blob]);
  const sender = new Sender();
  const file = await sender.upload(archive, null, password.value);
  const item = await createItem(file.url, userId);
  if (item) {
    addItemToGroup(item.id, groupId.value);
    message.value = "";
    password.value = "";
  }
}

async function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const buffer = reader.result;
    fileBlob.value = new Blob([buffer], { type: file.type });
    fileBlob.value.name = file.name;
  };
  reader.readAsArrayBuffer(file);
}

async function sendFile() {
  isFile.value = true;
  doSend(fileBlob.value);
}

async function sendMessage() {
  console.log(message.value);
  const blob = new Blob([message.value], { type: "text/plain" });
  blob.name = `${new Date().getTime()}.txt`;
  isFile.value = false;
  doSend(blob);
}

onMounted(() => {
  console.log("Checking storage for user.");
  const obj = get(keyFor("user"));
  if (obj) {
    const { email, id } = obj;
    console.log(`Loaded user ${email} with id ${id}`);
    // emailAddress.value = email;
    userId.value = id;
  }
});
</script>

<template>
  <h2>Enter a message or choose a file</h2>
  <label>
    Message
    <textarea v-model="message"></textarea>
  </label>
  <br />
  <label>
    File:
    <input type="file" @change="handleFile" />
  </label>
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
  <button @click="sendFile">Send File</button>
</template>

<style scoped>
textarea {
  width: 90%;
}
</style>
