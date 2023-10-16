<script setup>
import { ref, inject, onMounted, watch, watchEffect } from 'vue';

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
    console.log(
      `no public key, either call keychain.value.load() or generate a new one `
    );
    return;
  }

  const createResp = await userRef.value.createUser(
    email.value,
    jwkPublicKey.value
  );
  if (!createResp) {
    console.log(`could not create user, trying to log in`);
    const loginResp = await userRef.value.login(email.value);
    if (!loginResp) {
      console.log(`could not log in either 🤷`);
      return;
    }
    console.log(`logged in, user id is ${userRef.value.id}`);
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
    <button class="btn-primary" @click="generateKeys">Gen Keypair</button>
    <button class="btn-primary" @click="saveKeys">Store Keys</button>
    <button class="btn-primary" @click="loadKeys">Load Keys</button>
    <br />
    <label>
      ID:
      <input type="email" v-model="id" />
    </label>
    <br />
    <label>
      Email:
      <input type="email" v-model="email" />
    </label>
    <br />
    <button class="btn-primary" @click="storeUser">Store User</button>
    <button class="btn-primary" @click="loadUser">Load User</button>
    <br />
    <button class="btn-primary" @click="login">Log in</button>

    <br />
    <button class="btn-primary" @click="sendHeartbeat">Send heartbeat</button>
    <hr />
    <button class="btn-primary" @click="clearStorage">
      Clear Stored User and Keys
    </button>
    <br />
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
