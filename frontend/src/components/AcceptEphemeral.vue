<script setup>
import { ref, inject } from 'vue';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  aesDecryptChallenge,
  passwordUnwrapAESKey,
} from '../lib/crypt';
const api = inject('api');
const password = ref('abc');
const hash = ref(
  '3BUOOjnSKFTNj-otohlrKjXD2TQG9HmKxctp6AaMccdtxtsX6faUhBoqAp1F76Gm2l6BkVF5snxuHJQnmj0QxA'
);

async function acceptEphemeralLink() {
  // call api at /api/ephemeral/:hash
  const resp = await api.getEphemeralLinkChallenge(hash.value);

  if (!resp) {
    console.log('uh oh');
    return;
  }
  // receive the wrapped key, salt, and challengeCiphertext
  const { salt, challengeCiphertext, wrappedKey } = resp;

  try {
    // unwrap the key with the password
    let result = await passwordUnwrapAESKey(wrappedKey, password.value, salt);
    console.log(`it worked!`);

    // decrypt the challenge ciphertext and send it back
    // this allows me to create a user?
  } catch (e) {
    console.log(e);
    return;
  }
}
</script>
<template>
  <br />
  <hr />
  <h1>Ephemeral Link</h1>
  <label>
    Hash (get this from route in future):
    <input v-model="hash" />
  </label>
  <label>
    Password:
    <input v-model="password" />
  </label>
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="acceptEphemeralLink"
  >
    Go
  </button>
</template>
