<script setup>
import { ref, watch, watchEffect, inject, onMounted } from 'vue';
const api = inject('api');
const keychain = inject('keychain');
const { user, setUser, storeUser, loadUser } = inject('user');
import {
  generateAESKey,
  compareKeys,
  exportKeyToBase64,
  unwrapAESKey,
  wrapAESKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  passwordWrapAESKey,
  passwordUnwrapAESKey,
  aesEncryptChallenge,
  aesDecryptChallenge,
  generateSalt,
} from '../lib/crypt';

const showDebug = ref(false);

onMounted(async () => {
  // loadKeychain();
  // loadUser();
  // setUser({
  //   id: 1,
  // });

  window.keychain = keychain;
  window.generateAESKey = generateAESKey;
  if (keychain.status) {
    keychain.status();
  }
  // await keychain.generateUserKeyPair();
  // window.aes = await generateAESKey();
  // keychain.add('a', aes);

  // window.generateRSAKeyPair = generateRSAKeyPair;
  // window.wrapAESKey = wrapAESKey;
  // window.Storage = Storage;
  window.compareKeys = compareKeys;
  window.exportKeyToBase64 = exportKeyToBase64;
  window.unwrapAESKey = unwrapAESKey;
  window.wrapAESKey = wrapAESKey;
  window.arrayBufferToBase64 = arrayBufferToBase64;
  window.base64ToArrayBuffer = base64ToArrayBuffer;
  window.passwordWrapAESKey = passwordWrapAESKey;
  window.passwordUnwrapAESKey = passwordUnwrapAESKey;
  window.aesEncryptChallenge = aesEncryptChallenge;
  window.generateSalt = generateSalt;
  window.aesDecryptChallenge = aesDecryptChallenge;
  // const aes = await generateAESKey();
  // await window.keychain.generateKeyPair();
  // await window.keychain.add('1', aes);
  // const unwrapped = await window.keychain.get('1');
  // const didMatch = await compareKeys(aes, unwrapped);
  // console.log(`Did the original and the unwrapped match? ${didMatch}`);
});

const jwkPublicKey = ref('');

async function generateKeys() {
  if (keychain.generateUserKeyPair) {
    await keychain.generateUserKeyPair();
    jwkPublicKey.value = JSON.stringify(await keychain.getUserPublicKeyJwk());
  }
}

async function saveKeys() {
  if (keychain.store) {
    await keychain.store();
  }
}

async function loadKeys() {
  if (keychain.load) {
    await keychain.load();
  }
}

keychain.addOnload(async () => {
  jwkPublicKey.value = JSON.stringify(await keychain.getUserPublicKeyJwk());
});

async function createApiUser() {
  const email = user.value.email;
  jwkPublicKey.value = await keychain.getUserPublicKeyJwk();

  const resp = await api.createUser(email, jwkPublicKey.value);
  if (resp) {
    const { id, tier } = resp.user;
    setUser({
      id,
      email,
      tier,
    });

    storeUser(id, email, tier);
  }
}
</script>
<template>
  <a href="#" @click.prevent="showDebug = !showDebug">
    {{ showDebug ? 'Hide' : 'Show' }} debug panel
  </a>
  <div v-if="showDebug">
    <label>
      Public Key:
      <br />
      <textarea v-model="jwkPublicKey">{{ jwkPublicKey }}</textarea>
    </label>
    <br />
    <button
      class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      @click="generateKeys"
    >
      Gen Keypair
    </button>
    <button
      class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      @click="saveKeys"
    >
      Store Keys
    </button>
    <button
      class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      @click="loadKeys"
    >
      Load Keys
    </button>
    <br />
    <label>
      User id:
      <input type="number" v-model="user.id" />
    </label>
    <br />
    <label>
      Email:
      <input type="email" v-model="user.email" />
    </label>
    <br />
    <button
      class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      @click="storeUser"
    >
      Save User
    </button>
    <button
      class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      @click="loadUser"
    >
      Load User
    </button>
    <br />
    <button
      class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      @click="createApiUser"
    >
      Create Api User
    </button>
    <!-- <br />
  <label>
    <input type="checkbox" disabled :checked="keychain.privateKey" />
    privateKey: {{ keychain.privateKey }}
  </label>
  <br />
  <label>
    <input type="checkbox" disabled :checked="keychain.publicKey" />
    publicKey: {{ keychain.publicKey }}
  </label>
  <br />
  <button @click.prevent="loadKeychain()">Load Keys</button> -->
    <hr />
  </div>
</template>

<style scoped>
textarea {
  width: 80%;
  height: 8em;
  font-size: 10px;
}
hr {
  margin-top: 1em;
  padding-top: 1em;
  /* padding-bottom: 1em; */
  margin-bottom: 0;
}
</style>
