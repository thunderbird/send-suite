<script setup>
/* This component should download and decrypt the contents of the URL. */
import Receiver from "../lib/receiver";
import { ref, watch } from "vue";
const props = defineProps({
  url: String,
});

const message = ref(null);
const password = ref(null);
const needsPassword = ref(false);

const isMessage = (fileType) => ["text/plain"].includes(fileType);

async function doDownload() {
  const url = new URL(props.url);
  const secretKey = url.hash.substring(1);
  const id = url.pathname.split("/")[2];
  const result = await fetch(url.href);
  if (result.ok) {
    const data = await result.json();
    if (data.metadata.pwd && !password.value) {
      needsPassword.value = true;
      return;
    }
    const receiver = new Receiver({
      secretKey: secretKey, // Not so secret - it's the hash at the end of the URL
      id: id,
      url: url.href,
      nonce: data?.metadata?.nonce,
      requiresPassword: needsPassword.value,
      password: password.value,
    });
    await receiver.getMetadata();
    const optionalContent = await receiver.download({
      noSave: isMessage(receiver.fileInfo.type), // You do want to save
      // ignoring the stream option for now
      // stream: false,
    });
    if (optionalContent) {
      message.value = optionalContent;
    }
  } else {
    throw new Error(result.response.status);
  }
}

watch(
  () => props.url,
  () => {
    console.log(`
  props.url: ${props.url}
  needsPassword.value: ${needsPassword.value}
  password.value: ${password.value}
  `);

    if (!props.url) {
      return;
    }

    // Reset these any time the url changes
    needsPassword.value = false;
    password.value = null;
    message.value = null;
    doDownload();
  }
);
</script>

<template>
  <div>{{ url }}</div>
  <form v-if="needsPassword" @submit.prevent="doDownload">
    <label>
      Password:
      <input v-model="password" type="password" />
    </label>
    <input type="submit" value="submit" />
  </form>
  <textarea v-if="message">{{ message }}</textarea>
</template>

<style scoped>
textarea {
  width: 90%;
  height: 6rem;
}
</style>
