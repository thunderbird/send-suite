<script setup>
import { ref, watch, inject } from 'vue';
const keychain = inject('keychain');

const privateKey = ref(null);
const publicKey = ref(null);

watch(
  () => keychain?.value?.publicKey,
  async () => {
    publicKey.value = await crypto.subtle.exportKey(
      'jwk',
      keychain.value.publicKey
    );
  }
);
watch(
  () => keychain?.value?.privateKey,
  async () => {
    privateKey.value = await crypto.subtle.exportKey(
      'jwk',
      keychain.value.privateKey
    );
  }
);
</script>
<template>
  <label>
    <input type="checkbox" :checked="keychain?.privateKey" />
    privateKey
  </label>
  <br />
  <label>
    <input type="checkbox" :checked="keychain?.publicKey" />
    publicKey
  </label>
  <br />
  <button @click.prevent="keychain.load()">Load Keys</button>
</template>
