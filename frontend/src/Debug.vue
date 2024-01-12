<script setup>
import { ref, watchEffect } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';

import { Storage } from '@/lib/storage';

import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';

// import useConfigurationStore from '@/stores/configuration-store';
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

const { keychain } = useKeychainStore();
const { user } = useUserStore();
const folderStore = useFolderStore();
const storage = new Storage();

watchEffect(async () => {
  email.value = user.email;
  id.value = user.id;
  jwkPublicKey.value = JSON.stringify(await keychain.rsa.getPublicKeyJwk());
});

async function generateKeys() {
  await keychain.rsa.generateKeyPair();
  jwkPublicKey.value = JSON.stringify(await keychain.rsa.getPublicKeyJwk());
}

async function saveKeys() {
  await keychain.store();
}

async function loadKeys() {
  await keychain.load();
}

async function storeUser() {
  if (!user.id) {
    console.log(`no user to store`);
    return;
  }
  console.log(`storing user with id ${user.id}`);
  await user.store();
}

async function loadUser() {
  await user.load();
}

async function login() {
  if (!keychain.rsa.publicKey) {
    console.log(`no public key, either call keychain.value.load() or generate a new one `);
    return;
  }

  const createUserResp = await user.createUser(email.value, jwkPublicKey.value);
  if (!createUserResp) {
    console.log(`could not create user, trying to log in`);
    const loginResp = await user.login(email.value);
    if (!loginResp) {
      console.log(`could not log in either 🤷`);
      return;
    }
    console.log(`logged in, user id is ${user.id}`);
  }

  if (!folderStore.defaultFolder) {
    // Creating a default folder
    const createFolderResp = await folderStore.createFolder();
    if (createFolderResp) {
      console.log(`👍👍👍👍👍👍👍👍👍👍👍 created a folder`);
    } else {
      console.log(`could not create a folder 🐓🐓🐓🐓🐓🐓🐓🐓🐓🐓🐓`);
    }
  }
}

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
      </div>
      <Btn @click="clearStorage"> Clear Stored User and Keys </Btn>
    </div>
  </div>
</template>
