<script setup>
import { ref, onMounted } from "vue";
import Sender from "../lib/sender";
import Archive from "../lib/archive";
import { createItem, shareWith, userExists } from "../lib/api";

const props = defineProps({
  user: Object,
});

const message = ref(null);

const password = ref(null);
const fileBlob = ref(null);
const isFile = ref(false);
const emailAddresses = ref("");

async function doSend(blob, user) {
  const isValidUser = await userExists(emailAddresses.value);
  if (isValidUser) {
    const archive = new Archive([blob]);
    const sender = new Sender();
    const file = await sender.upload(archive, null, password.value);
    const item = await createItem(file.url, user.id, isFile.value);
    if (item) {
      await shareWith(item.id, user.email, [emailAddresses.value]);
    } else {
      alert(`could not share with ${emailAddresses.value}`);
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
  doSend(fileBlob.value, props.user);
}

async function sendMessage() {
  console.log(message.value);
  const blob = new Blob([message.value], { type: "text/plain" });
  blob.name = `${new Date().getTime()}.txt`;
  isFile.value = false;
  doSend(blob, props.user);
}

onMounted(() => {
  if (props.user) {
    console.log(`I have a props.user`);
    console.log(props.user);
  } else {
    console.log(`no props.user for Compose.vue`);
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
