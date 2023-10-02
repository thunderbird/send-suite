<script setup>
import {
  ref,
  reactive,
  onMounted,
  provide,
  watch,
  watchEffect,
  computed,
} from 'vue';
import { useRouter } from 'vue-router';
import { ApiConnection } from '@/lib/api';

import { Keychain } from '@/lib/keychain';
import { Storage } from '@/lib/storage';
import { User } from './lib/user';
import { createMessageSocket } from '@/lib/messageSocket';
const router = useRouter();

const api = new ApiConnection('https://localhost:8088');
provide('api', api);

const messageSocket = ref(null);
provide('messageSocket', messageSocket);

const messageBus = ref(null);
provide('messageBus', messageBus);

const isInitComplete = ref({});

const storage = new Storage();
window.storage = storage;

const _keychain = new Keychain(storage);
const reactiveKeychain = ref(_keychain);
provide('keychain', reactiveKeychain);

const _user = new User(api, storage);
const reactiveUser = ref(_user);
provide('user', reactiveUser);

// watch(user, async () => {
//   if (user.value.id !== 0) {
//     messageSocket.value = await createMessageSocket(user.value.id);
//     if (messageSocket.value) {
//       console.log(`created messageSocket`);
//       messageSocket.value.onmessage = (event) => {
//         console.log(`heard from the messageSocket`);
//         console.log(event.data);
//         const data = JSON.parse(event.data);
//         switch (data?.type) {
//           case 'burn':
//             if (data?.conversationId) {
//               cleanAfterBurning(data.conversationId);
//             }
//             break;
//           case 'newMessage':
//             if (data?.conversationId) {
//               newMessageCallbacks.forEach((cb) => {
//                 cb(data.conversationId);
//               });
//             }
//             break;
//           case 'newChat':
//             newChatCallbacks.forEach((cb) => {
//               cb();
//             });
//           default:
//             break;
//         }
//       };
//     }
//     isInitComplete.value = true;
//   }
// });

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

provide('onNewMessage', onNewMessage);
const newMessageCallbacks = [];
async function onNewMessage(cb) {
  newMessageCallbacks.push(cb);
}

provide('onNewChat', onNewChat);
const newChatCallbacks = [];
async function onNewChat(cb) {
  newChatCallbacks.push(cb);
}

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
