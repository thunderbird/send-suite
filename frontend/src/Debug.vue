<script setup>
import { ref, watch, watchEffect, inject, onMounted } from 'vue';

const api = inject('api');
const keychain = inject('keychain');
const { user, setUser, storeUser, loadUser } = inject('user');
// const eventSource = inject('eventSource');
const messageSocket = inject('messageSocket');

const showDebug = ref(true);

onMounted(async () => {
  window.keychain = keychain;
});

const jwkPublicKey = ref('');

async function generateKeys() {
  if (keychain?.rsa?.generateKeyPair) {
    await keychain.rsa.generateKeyPair();
    jwkPublicKey.value = JSON.stringify(await keychain.rsa.getPublicKeyJwk());
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

// keychain.addOnload(async () => {
//   jwkPublicKey.value = JSON.stringify(await keychain.rsa.getPublicKeyJwk());
// });

async function createApiUser() {
  const email = user.value.email;
  jwkPublicKey.value = await keychain.rsa.getPublicKeyJwk();

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

function resetStorage() {}

async function sendHeartbeat() {
  console.log(`sending heartbeat`);
  messageSocket.value.send(
    JSON.stringify({
      id: user.value.id,
      ts: new Date().getTime(),
    })
  );
  // const resp = await api.sendHeartbeat(user.value.id);
  // if (resp) {
  //   console.log(resp);
  // }
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
      User id:
      <input type="number" v-model="user.id" />
    </label>
    <br />
    <label>
      Email:
      <input type="email" v-model="user.email" />
    </label>
    <br />
    <button class="btn-primary" @click="storeUser">Save User</button>
    <button class="btn-primary" @click="loadUser">Load User</button>
    <br />
    <button class="btn-primary" @click="createApiUser">Create Api User</button>
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
    <br />
    <button class="btn-primary" @click="sendHeartbeat">Send heartbeat</button>
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
