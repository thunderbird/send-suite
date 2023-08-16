<script setup>
import { ref, watch, watchEffect, inject } from 'vue';
const keychain = inject('keychain');

// const privateKey = ref(null);
// const publicKey = ref(null);

// watch(
//   [() => keychain],
//   () => {
//     debugger;
//     privateKey.value = keychain.privateKey;
//     publicKey.value = keychain.publicKey;
//   },
//   true
// );

function loadKeychain() {
  keychain.load();
}

// watch(
//   () => keychain.publicKey,
//   async () => {
//     publicKey.value = keychain.publicKey;
//     console.log(`debug: have publicKey`);
//   }
// );
// watch(
//   () => keychain.privateKey,
//   async () => {
//     privateKey.value = keychain.privateKey;
//     console.log(`debug: have privateKey`);
//   }
// );
</script>
<template>
  <label>
    <input type="checkbox" disabled :checked="keychain.privateKey" />
    privateKey: {{ keychain.privateKey }}
  </label>
  <br />
  <label>
    <input type="checkbox" disabled :checked="keychain.publicKey" />
    publicKey: {{ keychain.publicKey }}
  </label>
  <br />
  <button @click.prevent="loadKeychain()">Load Keys</button>
</template>
