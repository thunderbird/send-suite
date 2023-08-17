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
  'rXcUWM1F11ciVWqJs4H8Q7M2-zHWZ8dtZmEXhHwRJ0lkQ9na5mx6I0zWVab6WcxKRCTrCiqf2t2o3_9EKoZjqA'
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
  const keyBuffer = base64ToArrayBuffer(wrappedKey);
  const saltBuffer = base64ToArrayBuffer(salt);
  try {
    // unwrap the key with the password
    let unwrappedKey = await passwordUnwrapAESKey(
      keyBuffer,
      password.value,
      saltBuffer
    );
    console.log(`unwrapping worked!`);

    let challengePlaintext = await aesDecryptChallenge(
      base64ToArrayBuffer(challengeCiphertext),
      unwrappedKey,
      saltBuffer
    );

    console.log(`drum roll`);
    console.log(challengePlaintext);

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
