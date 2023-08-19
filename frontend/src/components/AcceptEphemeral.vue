<script setup>
import { ref, inject } from 'vue';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  aesDecryptChallenge,
  passwordUnwrapAESKey,
} from '../lib/crypt';
const api = inject('api');
const password = ref('');
// const hash = ref('');
const message = ref('');

const props = defineProps({
  hash: String,
});

const emit = defineEmits(['setConversationId']);

async function acceptEphemeralLink() {
  // call api at /api/ephemeral/:hash
  const resp = await api.getEphemeralLinkChallenge(props.hash);

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

    // decrypt the challenge ciphertext and send it back
    let challengePlaintext = await aesDecryptChallenge(
      base64ToArrayBuffer(challengeCiphertext),
      unwrappedKey,
      saltBuffer
    );

    console.log(`drum roll`);
    console.log(challengePlaintext);

    const challengeResp = await api.acceptEphemeralLink(
      props.hash,
      challengePlaintext
    );

    console.log(challengeResp);
    message.value = 'Successful challenge!';

    emit('setConversationId', challengeResp.containerId);

    // this allows me to create a user?
    // next:
    // - store the unwrappedKey under challengeResp.containerId
    // - generate keys
    // - create an api user
    // - store user info to localStorage
    // - then...go to the conversation?
  } catch (e) {
    message.value = 'Incorrect hash or password';
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
    Hash from the route:
    <input :value="props.hash" disabled />
  </label>
  <br />
  <label>
    Password:
    <input v-model="password" />
  </label>
  <div>
    {{ message }}
  </div>
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="acceptEphemeralLink"
  >
    Go
  </button>
</template>
