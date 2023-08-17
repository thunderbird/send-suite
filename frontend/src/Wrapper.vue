<script setup>
/*
Should:
- provide userId globally
- provide keychain globally


Does vue already have the notion of a store?
(Or is this why Pinia exists?)
*/
import { ref, onMounted, provide, watch } from 'vue';
import { ApiConnection } from './lib/api';
import Storage from './lib/storage/localStorage';
import {
  Keychain,
  generateAESKey,
  compareKeys,
  exportKeyToBase64,
  unwrapAESKey,
  wrapAESKey,
  bufferToBase64,
  base64ToArrayBuffer,
} from './lib/crypt';

const isInitComplete = ref({});

const api = new ApiConnection('https://localhost:8088');

// const keychain = ref(null);
const user = ref({
  id: 0,
  email: '',
});
function setUser(obj) {
  user.value = {
    ...user.value,
    ...obj,
  };
  console.log(`🤷 Updated user`);
}

provide('api', api);
provide('user', {
  user,
  setUser,
});

const keychain = new Keychain(new Storage());
provide('keychain', keychain);

watch(user, () => {
  if (user.value.id !== 0) {
    // isInitComplete.value = true;
  }
});

onMounted(async () => {
  // keychain.load();
  // console.log('TODO: get/set auth0 user');

  // console.log(`api should have a value now`);

  window.keychain = keychain;
  window.generateAESKey = generateAESKey;

  keychain.status();
  await keychain.generateUserKeyPair();
  window.aes = await generateAESKey();
  keychain.add('a', aes);

  // window.generateRSAKeyPair = generateRSAKeyPair;
  // window.wrapAESKey = wrapAESKey;
  window.compareKeys = compareKeys;
  // window.Storage = Storage;
  window.exportKeyToBase64 = exportKeyToBase64;
  window.unwrapAESKey = unwrapAESKey;
  window.wrapAESKey = wrapAESKey;
  window.bufferToBase64 = bufferToBase64;
  window.base64ToArrayBuffer = base64ToArrayBuffer;
  // const aes = await generateAESKey();
  // await window.keychain.generateKeyPair();
  // await window.keychain.add('1', aes);
  // const unwrapped = await window.keychain.get('1');
  // const didMatch = await compareKeys(aes, unwrapped);
  // console.log(`Did the original and the unwrapped match? ${didMatch}`);
});
</script>

<template>
  <slot v-if="isInitComplete"></slot>
</template>
