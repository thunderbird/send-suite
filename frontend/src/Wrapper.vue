<script setup>
import { ref, onMounted, provide, watch } from 'vue';
import { useRouter } from 'vue-router';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';

import { Keychain } from '@/lib/keychain';
import { Storage } from '@/lib/storage';
import { User } from '@/lib/user';
import { MessageBus } from '@/lib/messageBus';
const router = useRouter();

const TEMP_SERVER_URL = 'https://localhost:8088';

const { api } = useApiStore();
const { user } = useUserStore();
const { keychain } = useKeychainStore();

const messageBus = new MessageBus(TEMP_SERVER_URL);
provide('messageBus', messageBus);

// TODO: consider getting rid of this.
const isInitComplete = ref(true);

const storage = new Storage();
provide('storage', storage);
window.storage = storage;

// Init the messageBus for this user
watch(
  () => user.id,
  async () => {
    const success = await messageBus.initConnection(user.id);
    if (success) {
      messageBus.addCallback('burn', (data) => {
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
    await keychain.load();
  } catch (e) {
    console.log(`no keys`);
    return;
  }
  console.log(`keychain loaded`);
  if (keychain.rsa.privateKey) {
    console.log(`we have keys, attempting to load user`);
    // user.load();
    user.load();
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
    keychain.get(conversationId);
    console.log(`CLEANING ${conversationId}`);
    keychain.remove(conversationId);

    if (user.tier !== 'PRO') {
      keychain.clear();
      localStorage.removeItem('send-user');
      router.push('/');
    }
    alert('🗨️🔥');
    window.location.reload();
  } catch (e) {
    console.log(`not burning ${conversationId}, as this client isn't part of it`);
  }
}
</script>

<template>
  <slot v-if="isInitComplete"></slot>
</template>
