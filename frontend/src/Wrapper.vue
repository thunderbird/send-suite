<script setup>
/*
Should:
- provide userId globally
- provide keyStore globally


Does vue already have the notion of a store?
(Or is this why Pinia exists?)
*/
import { ref, onMounted, provide } from 'vue';
import { ApiConnection } from './lib/api';
import {
  generateAESKey,
  loadKeyFromStorage,
  saveKeyToStorage,
} from './lib/crypt';

const keyStore = ref(null);
const isInitComplete = ref({});

const api = new ApiConnection('https://localhost:8088');

provide('api', api);
provide('user', {
  id: 1,
  name: 'me',
});

provide('keyStore', keyStore);

onMounted(async () => {
  console.log('TODO: get/set auth0 user');

  console.log(`api should have a value now`);

  // Really, I want to do this per folder - not the same key for all folders/convos/etc.
  let aesKey = await loadKeyFromStorage();
  if (!aesKey) {
    console.log('no key, generating and storing');
    aesKey = await generateAESKey();
    saveKeyToStorage(aesKey);
  } else {
    console.log(`I have the key already. gah. tina, eat your food.`);
  }
  keyStore.value = {
    1: aesKey,
  };

  isInitComplete.value = true;
  console.log();
});
</script>

<template>
  <slot v-if="isInitComplete"></slot>
</template>
