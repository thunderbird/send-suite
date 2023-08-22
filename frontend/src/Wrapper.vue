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
import { createMessageSocket } from './lib/messageSocket';
const router = useRouter();

const api = new ApiConnection('https://localhost:8088');

provide('api', api);

const user = ref({
  id: 0,
  email: '',
});

// const eventSource = ref(null);
// provide('eventSource', eventSource);
const messageSocket = ref(null);
provide('messageSocket', messageSocket);

const messageBus = ref(null);
provide('messageBus', messageBus);

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

watch(user, async () => {
  if (user.value.id !== 0) {
    messageSocket.value = await createMessageSocket(user.value.id);
    if (messageSocket.value) {
      console.log(`created messageSocket`);
      messageSocket.value.onmessage = (event) => {
        console.log(`heard from the messageSocket`);
        console.log(event.data);
        const data = JSON.parse(event.data);
        if (data?.type === 'burn' && data?.conversationId) {
          cleanAfterBurning(data.conversationId);
        }
      };
    }
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
  console.log(`BURNING ${conversationId}`);
  const resp = await api.burnAfterReading(conversationId);
  console.log(resp);
  return resp;
}

provide('clean', cleanAfterBurning);
function cleanAfterBurning(conversationId) {
  try {
    keychain.get(conversationId);
    console.log(`CLEANING ${conversationId}`);
    keychain.remove(conversationId);

    if (user.value.tier !== 'PRO') {
      keychain.clear();
      localStorage.removeItem('send-user');
      router.push('/');
    }
    alert('🗨️🔥');
    window.location.reload();
  } catch (e) {
    console.log(
      `not burning ${conversationId}, as this client isn't part of it`
    );
  }
}
</script>

<template>
  <slot v-if="isInitComplete"></slot>
</template>
