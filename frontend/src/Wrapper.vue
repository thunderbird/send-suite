<script setup>
/*
Should:
- provide userId globally
- provide keychain globally


Does vue already have the notion of a store?
(Or is this why Pinia exists?)
*/
import { ref, onMounted, provide, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ApiConnection } from './lib/api';
import Storage from './lib/storage/localStorage';
import { Keychain } from './lib/crypt';
const router = useRouter();

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
  console.log(`set user object as ref`);
  console.log(obj);
}

function storeUser(id, email, tier) {
  const jsonUser = JSON.stringify({
    id,
    email,
    tier,
  });
  localStorage.setItem('send-user', jsonUser);
}
function loadUser() {
  const jsonUser = localStorage.getItem('send-user');
  if (jsonUser) {
    setUser(JSON.parse(jsonUser));
  }
}

provide('user', {
  user: computed(() => user.value),
  setUser,
  storeUser,
  loadUser,
});

const isInitComplete = ref({});

const keychain = new Keychain(new Storage());
provide('keychain', keychain);

watch(user, () => {
  if (user.value.id !== 0) {
    isInitComplete.value = true;
  }
});

keychain.addOnload(() => {
  console.log(`confirming keychain.addOnload works`);
});

onMounted(async () => {
  try {
    await keychain.load();
  } catch (e) {
    console.log(`no keys`);
    return;
  }
  console.log(`keychain loaded`);
  if (keychain.keys) {
    console.log(`we have keys`);
    loadUser();
  }
  // console.log('TODO: get/set auth0 user');
  // console.log(`api should have a value now`);
});

provide('burn', burnAfterReading);
async function burnAfterReading(conversationId) {
  const resp = await api.burnAfterReading(conversationId);
  if (!resp) {
    return;
  }
  keychain.remove(conversationId);
  // do not do the following for pro users

  if (user.value.tier !== 'PRO') {
    keychain.clear();
    localStorage.removeItem('send-user');
    router.push('/');
  }
  alert('🗨️🔥');
  window.location.reload();
}
</script>

<template>
  <slot v-if="isInitComplete"></slot>
</template>
