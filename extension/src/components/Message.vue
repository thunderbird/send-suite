<script setup>
/* This component should download and decrypt the contents of the URL. */
import Receiver from "../lib/receiver";
import { ref, computed, watchEffect } from "vue";
const props = defineProps({
  url: String,
});

const message = ref(null);

const urlRef = computed(() => props.url && new URL(props.url));
const secretKey = computed(() => urlRef.value.hash.substring(1));
const id = computed(() => urlRef.value.pathname.split("/")[2]);

watchEffect(async () => {
  if (!urlRef?.value?.href) {
    return;
  }
  console.log(props.url);
  const result = await fetch(urlRef.value.href);
  if (result.ok) {
    const data = await result.json();
    console.log(`Retrieved from ${urlRef.value.href}`);
    console.log(data);
    const receiver = new Receiver({
      secretKey: secretKey.value, // Not so secret - it's the hash at the end of the URL
      id: id.value,
      url: urlRef.value.href,
      nonce: data?.metadata?.nonce,
      requiresPassword: false,
      // When we use passwords, will also need:
      // password: 'whatever-user-enters-when-we-prompt-them'
    });
    await receiver.getMetadata();
    const optionalContent = await receiver.download({
      noSave: true, // You do want to save
      // ignoring the stream option for now
      // stream: false,
    });
    if (optionalContent) {
      message.value = optionalContent;
    }
  } else {
    throw new Error(result.response.status);
  }
});
</script>

<template>
  <div>{{ url }}</div>
  <textarea>{{ message }}</textarea>
</template>
