<script setup>
import { ref, watch, watchEffect, inject, onMounted } from 'vue';
const api = inject('api');
const keychain = inject('keychain');
const { user, setUser } = inject('user');

// const privateKey = ref(null);
// const publicKey = ref(null);

const jwkPublicKey = ref('');

// watch(
//   [() => keychain],
//   () => {
//     debugger;
//     privateKey.value = keychain.privateKey;
//     publicKey.value = keychain.publicKey;
//   },
//   true
// );

async function loadKeychain() {
  await keychain.load();
  jwkPublicKey.value = JSON.stringify(await keychain.getUserPublicKeyJwk());
}

onMounted(() => {
  loadKeychain();
  loadUser();
  // setUser({
  //   id: 1,
  // });
});

function loadUser() {
  const jsonUser = localStorage.getItem('send-user');
  if (jsonUser) {
    setUser(JSON.parse(jsonUser));
  }
}
function storeUser() {
  const jsonUser = JSON.stringify({
    id: user.value.id,
    email: user.value.email,
  });
  localStorage.setItem('send-user', jsonUser);
}

function generateKeys() {
  if (keychain.generateUserKeyPair) {
    keychain.generateUserKeyPair();
  }
}

function saveKeys() {
  if (keychain.store) {
    keychain.store();
  }
}

async function createApiUser() {
  const email = user.value.email;
  jwkPublicKey.value = await keychain.getUserPublicKeyJwk();

  const resp = await api.createUser(email, jwkPublicKey.value);
  if (resp) {
    const { id } = resp.user;
    setUser({
      id,
      email,
    });
    storeUser();
  }
}
</script>
<template>
  <label>
    User id:
    <input type="number" v-model="user.id" />
  </label>
  <br />
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="storeUser"
  >
    Save User
  </button>
  <br />
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="generateKeys"
  >
    Create User Keys
  </button>
  <br />
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="saveKeys"
  >
    Save User Keys
  </button>
  <br />
  <label>
    Email:
    <input type="email" v-model="user.email" />
  </label>
  <br />
  <label>
    Public Key:
    <br />
    <textarea v-model="jwkPublicKey">{{ jwkPublicKey }}</textarea>
  </label>
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
</template>

<style scoped>
textarea {
  width: 80%;
  height: 5em;
}
</style>
