<script setup>
import { ref, onMounted, inject } from "vue";
import Sender from "../lib/sender";
import Archive from "../lib/archive";

const { api } = inject("api");
const { user } = inject("user");

const message = ref(null);
const password = ref(null);
const fileBlob = ref(null);
const isFile = ref(false);
const recipientAddress = ref("");

async function sendBlob(blob) {
  const userObj = user.value;
  console.log(`sending from ${userObj.email} to ${recipientAddress.value}`);
  const isValidUser = await api.value.userExists(recipientAddress.value);
  if (isValidUser) {
    const archive = new Archive([blob]);
    const sender = new Sender();
    const file = await sender.upload(archive, null, password.value);
    const item = await api.value.createItem(file.url, userObj.id, isFile.value);
    if (item) {
      await api.value.shareWith(item.id, userObj.email, [
        recipientAddress.value,
      ]);
    } else {
      alert(`could not share with ${recipientAddress.value}`);
    }
  } else {
    alert(`User does not exist.`);
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
  sendBlob(fileBlob.value);
}

async function sendMessage() {
  console.log(message.value);
  const blob = new Blob([message.value], { type: "text/plain" });
  blob.name = `${new Date().getTime()}.txt`;
  isFile.value = false;
  sendBlob(blob);
}

onMounted(() => {});
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
    <input type="email" v-model="recipientAddress" />
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
