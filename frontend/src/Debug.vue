<script setup>
import { ref, inject, onMounted, watchEffect } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';

import useConfigurationStore from '@/stores/configuration-store';

// const configurationStore = useConfigurationStore();
// configurationStore.$onAction((actionInfo) => {
//   console.log(actionInfo);
// console.log(`the serverUrl is ${configurationStore.serverUrl}`);
// });
// configurationStore.setServerUrl(`http://blah.com`);

const email = ref('');
const id = ref(null);
const jwkPublicKey = ref('');
const showDebug = ref(false);

// const api = inject('api');
const keychainRef = inject('keychainRef');
const userRef = inject('userRef');
// const eventSource = inject('eventSource');
const messageBus = inject('messageBus');
const storage = inject('storage');

const { createFolder } = inject('folderManager');

watchEffect(() => {
  email.value = userRef.value.email;
  id.value = userRef.value.id;
  console.log(`Debug.vue using stored user id and email`);
});

watchEffect(async () => {
  jwkPublicKey.value = await keychainRef.value.rsa.getPublicKeyJwk();
  console.log(`Debug.vue setting jwk version of stored public key`);
});

onMounted(async () => {
  window.keychain = keychainRef.value;
});

async function generateKeys() {
  if (keychainRef.value?.rsa?.generateKeyPair) {
    await keychainRef.value.rsa.generateKeyPair();
    jwkPublicKey.value = await keychainRef.value.rsa.getPublicKeyJwk();
  }
}

async function saveKeys() {
  if (keychainRef.value.store) {
    await keychainRef.value.store();
  }
}

async function loadKeys() {
  if (keychainRef.value.load) {
    await keychainRef.value.load();
  }
}

// keychain.addOnload(async () => {
//   jwkPublicKey.value = JSON.stringify(await keychain.rsa.getPublicKeyJwk());
// });

async function storeUser() {
  if (!userRef.value.id) {
    console.log(`no user to store`);
    return;
  }
  console.log(`storing user with id ${userRef.value.id}`);
  await userRef.value.store();
}

async function loadUser() {
  await userRef.value.load();
}

async function login() {
  if (!keychainRef.value.rsa.publicKey) {
    console.log(`no public key, either call keychain.value.load() or generate a new one `);
    return;
  }

  console.log(`jwkPublicKey.value is:`);
  console.log(jwkPublicKey.value);
  const createUserResp = await userRef.value.createUser(email.value, jwkPublicKey.value);
  if (!createUserResp) {
    console.log(`could not create user, trying to log in`);
    const loginResp = await userRef.value.login(email.value);
    if (!loginResp) {
      console.log(`could not log in either 🤷`);
      return;
    }
    console.log(`logged in, user id is ${userRef.value.id}`);
  }
  const createFolderResp = await createFolder();
  if (createFolderResp) {
    console.log(`👍👍👍👍👍👍👍👍👍👍👍 created a folder`);
  } else {
    console.log(`could not create a folder 🐓🐓🐓🐓🐓🐓🐓🐓🐓🐓🐓`);
  }
}

async function sendHeartbeat() {
  console.log(`sending heartbeat`);
  messageBus.send(
    JSON.stringify({
      type: 'heartbeat',
      id: userRef.value.id,
      ts: new Date().getTime(),
    })
  );
}

messageBus.addCallback('heartbeat', ({ id, ts }) => {
  console.log(`Received heartbeat from user ${id} at ${ts}`);
});

function clearStorage() {
  storage.clear();
  window.location.reload();
}
</script>
<template>
  <div class="fixed right-1/2 z-50 translate-x-1/2 top-2 flex flex-col items-center">
    <Btn @click.prevent="showDebug = !showDebug"> {{ showDebug ? 'Hide' : 'Show' }} debug panel </Btn>
    <div v-if="showDebug" class="flex flex-col gap-2 bg-white p-1 mt-1">
      <label class="flex flex-col">
        <span>Public Key</span>
        <textarea v-model="jwkPublicKey"></textarea>
      </label>
      <div class="flex gap-1">
        <Btn @click="generateKeys">Gen Keypair</Btn>
        <Btn @click="saveKeys">Store Keys</Btn>
        <Btn @click="loadKeys">Load Keys</Btn>
      </div>
      <div class="flex gap-1">
        <label class="flex flex-col">
          <span>ID</span>
          <input type="text" v-model="id" class="w-32" />
        </label>
        <label class="flex flex-col">
          <span>Email</span>
          <input type="email" v-model="email" />
        </label>
      </div>
      <div class="flex gap-1">
        <Btn @click="storeUser">Store User</Btn>
        <Btn @click="loadUser">Load User</Btn>
        <Btn @click="login">Log in</Btn>
        <Btn @click="sendHeartbeat">Send heartbeat</Btn>
      </div>
      <Btn @click="clearStorage"> Clear Stored User and Keys </Btn>
    </div>
  </div>
</template>
@/stores/configuration-store
