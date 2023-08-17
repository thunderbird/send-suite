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
import { Keychain } from './lib/crypt';

const api = new ApiConnection('https://localhost:8088');

provide('api', api);

const user = ref({
  id: 0,
  email: '',
});

function setUser(obj) {
  user.value = {
    ...user.value,
    ...obj,
  };
}

provide('user', {
  user,
  setUser,
});

const isInitComplete = ref({});

const keychain = new Keychain(new Storage());
provide('keychain', keychain);

watch(user, () => {
  if (user.value.id !== 0) {
    isInitComplete.value = true;
  }
});

onMounted(async () => {
  keychain.load();
  // console.log('TODO: get/set auth0 user');
  // console.log(`api should have a value now`);
});
</script>

<template>
  <slot v-if="isInitComplete"></slot>
</template>
