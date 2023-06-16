<script setup>
import { ref, onMounted } from "vue";
import Sender from "../lib/sender";
import Archive from "../lib/archive";
import { loadUser } from "../lib/sync";
import { createItem, shareWith } from "../lib/api";
const message = ref(null);
const groupId = ref(1);
const userId = ref(0);
const userEmail = ref("");
const password = ref(null);
const fileBlob = ref(null);
const isFile = ref(false);
const emailAddresses = ref("75525@email.com");

async function doSend(blob) {
  const archive = new Archive([blob]);
  const sender = new Sender();
  const file = await sender.upload(archive, null, password.value);
  const item = await createItem(file.url, userId.value, isFile.value);
  if (item) {
    await shareWith(item.id, userEmail.value, [emailAddresses.value]);
  }
  // if (item) {
  //   addItemToGroup(item.id, groupId.value);
  //   message.value = "";
  //   password.value = "";
  // }
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
  try {
    const { email, id } = loadUser();
    console.log(`Loaded user ${email} with id ${id}`);
    userId.value = id;
    userEmail.value = email;
  } catch (error) {
    console.log(error);
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
    Share with
    <input type="email" v-model="emailAddresses" />
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
