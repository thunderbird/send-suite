<script setup>
import {
  ref,
  onMounted,
  provide,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';
import { ApiConnection } from '@/lib/api';

import { Keychain } from '@/lib/keychain';
import { Storage } from '@/lib/storage';
import { User } from '@/lib/user';
import { MessageBus } from '@/lib/messageBus';
const router = useRouter();

const TEMP_SERVER_URL = 'https://localhost:8088';

const api = new ApiConnection(TEMP_SERVER_URL);
provide('api', api);

const messageBus = new MessageBus(TEMP_SERVER_URL);
provide('messageBus', messageBus);

// TODO: consider getting rid of this.
const isInitComplete = ref(true);

const storage = new Storage();
provide('storage', storage);
window.storage = storage;

const _keychain = new Keychain(storage);
const reactiveKeychain = ref(_keychain);
provide('keychain', reactiveKeychain);

const _user = new User(api, storage);
const reactiveUser = ref(_user);
provide('user', reactiveUser);


// Init the messageBus for this user
watch(
  () => reactiveUser.value.id,
  async () => {
    const success = await messageBus.initConnection(reactiveUser.value.id);
    if (success) {
      messageBus.addCallback('burn', data => {
        if (data?.conversationId) {
          cleanAfterBurning(data.conversationId);
        }
      });
      // other callback types:
      // newChat
      // newMessage
      // isInitComplete.value = true;
    }
  }
);

onMounted(async () => {
  try {
    await reactiveKeychain.value.load();
  } catch (e) {
    console.log(`no keys`);
    return;
  }
  console.log(`keychain loaded`);
  if (reactiveKeychain.value.rsa.privateKey) {
    console.log(`we have keys, attempting to load user`);
    // user.load();
    reactiveUser.value.load();
  }
  // console.log('TODO: get/set auth0 user');
  // console.log(`api should have a value now`);
});

// provide('onNewMessage', onNewMessage);
// const newMessageCallbacks = [];
// async function onNewMessage(cb) {
//   newMessageCallbacks.push(cb);
// }

// provide('onNewChat', onNewChat);
// const newChatCallbacks = [];
// async function onNewChat(cb) {
//   newChatCallbacks.push(cb);
// }

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
    reactiveKeychain.value.get(conversationId);
    console.log(`CLEANING ${conversationId}`);
    reactiveKeychain.value.remove(conversationId);

    if (reactiveUser.value.tier !== 'PRO') {
      reactiveKeychain.value.clear();
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
