<script setup>
/*
Should:
- provide userId globally
- provide keychain globally


Does vue already have the notion of a store?
(Or is this why Pinia exists?)
*/
import { ref, onMounted, provide } from 'vue';
import { ApiConnection } from './lib/api';
import Storage from './lib/storage/localStorage';
import {
  // generateAESKey,
  // loadKeyFromStorage,
  // saveKeyToStorage,
  Keychain,
  // compareKeys,
} from './lib/crypt';

const keychain = ref(null);
const isInitComplete = ref({});

const api = new ApiConnection('https://localhost:8088');

provide('api', api);
provide('user', {
  id: 1,
  name: 'me',
});

provide('keychain', keychain);

onMounted(async () => {
  console.log('TODO: get/set auth0 user');

  console.log(`api should have a value now`);

  // Really, I want to do this per folder - not the same key for all folders/convos/etc.
  // let aesKey = await loadKeyFromStorage();
  // if (!aesKey) {
  //   console.log('no key, generating and storing');
  //   aesKey = await generateAESKey();
  //   saveKeyToStorage(aesKey);
  // } else {
  //   console.log(`I have the key already. gah. tina, eat your food.`);
  // }
  // keychain.value = {
  //   1: aesKey,
  // };

  const kc = new Keychain(new Storage());
  keychain.value = kc;

  window.keychain = keychain.value;
  // window.generateAESKey = generateAESKey;
  // window.compareKeys = compareKeys;
  // window.Storage = Storage;
  // const aes = await generateAESKey();
  // await window.keychain.generateKeyPair();
  // await window.keychain.add('1', aes);
  // const unwrapped = await window.keychain.get('1');
  // const didMatch = await compareKeys(aes, unwrapped);
  // console.log(`Did the original and the unwrapped match? ${didMatch}`);

  isInitComplete.value = true;
});
</script>

<template>
  <slot v-if="isInitComplete"></slot>
</template>
