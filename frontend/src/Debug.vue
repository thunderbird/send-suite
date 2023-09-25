<script setup>
import { ref, inject, onMounted } from 'vue';

const email = ref('');
const id = ref(null);
const jwkPublicKey = ref('');
const showDebug = ref(false);

// const api = inject('api');
const keychain = inject('keychain');
const user = inject('user');
// const eventSource = inject('eventSource');
const messageSocket = inject('messageSocket');

user._addOnLoad(async () => {
  email.value = user.email;
  id.value = user.id;
})
keychain._addOnLoad(async () => {
  jwkPublicKey.value = await keychain.rsa.getPublicKeyJwk();
})

onMounted(async () => {
  window.keychain = keychain;
});

async function generateKeys() {
  if (keychain?.rsa?.generateKeyPair) {
    await keychain.rsa.generateKeyPair();
    jwkPublicKey.value = await keychain.rsa.getPublicKeyJwk();
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

async function storeUser() {
  if (!user.id) {
    console.log(`no user to store`)
    return;
  }
  console.log(`storing user with id ${user.id}`)
  await user.store();
}

async function loadUser() {
  await user.load();

}

async function login() {
  if (!keychain.rsa.publicKey) {
    console.log(`no public key, either call keychain.load() or generate a new one `);
    return;
  }

  const loginResp = await user.createUser(email.value, jwkPublicKey.value);
  if (!loginResp) {
    console.log(`could not create user, trying to log in`)
    const loginResp = await user.login(email.value);
    if (!loginResp) {
      console.log(`could not log in either 🤷`)
      return;
    }
    console.log(`logged in, user id is ${user.id}`)
  }
}

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
