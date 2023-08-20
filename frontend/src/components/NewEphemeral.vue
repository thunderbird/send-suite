<script setup>
import { ref, inject } from 'vue';
import {
  passwordWrapAESKey,
  generateSalt,
  aesEncryptChallenge,
} from '../lib/crypt';

const api = inject('api');
const { user } = inject('user');
const keychain = inject('keychain');

const password = ref('');
const ephemeralHash = ref('');
const message = ref('');

async function requestEphemeralLink() {
  if (!password.value) {
    console.log(`no password provided`);
    message.value = 'Please enter a password';
    return;
  }

  if (!user.value.id) {
    console.log(`no logged in user`);
    message.value = 'Please log in';
    return;
  }

  // request a convo id, add it to my keychain
  const response = await api.createConversation(user.value.id);
  if (response && response.id) {
    const { id } = response;
    await keychain.createAndAddContainerKey(id);
    await keychain.store();

    // get the key (which unwraps it),
    const unwrappedKey = await keychain.get(id);

    // and password protect it
    const salt = generateSalt();
    const passwordWrappedKey = await passwordWrapAESKey(
      unwrappedKey,
      password.value,
      salt
    );

    // convert it and the salt to base64 strings
    const strPasswordWrappedKey = arrayBufferToBase64(passwordWrappedKey);
    const strSalt = arrayBufferToBase64(salt);

    // const challengePlaintext = 'abc123';

    const challengePlaintext = arrayBufferToBase64(generateSalt(128));
    const challengeCiphertext = arrayBufferToBase64(
      await aesEncryptChallenge(challengePlaintext, unwrappedKey, salt)
    );

    // with the password protected key and the salt, create an ephemeral link
    const resp = await api.createEphemeralLink(
      id,
      strPasswordWrappedKey,
      user.value.id,
      strSalt,
      challengePlaintext,
      challengeCiphertext
    );

    if (resp.id) {
      console.log(`created ephemeral link for convo ${id}`);
      const hash = resp.id;
      const { origin } = new URL(window.location.href);
      const url = `${origin}/ephemeral/${hash}`;
      // const url = hash;
      ephemeralHash.value = url;
      message.value = '';
    }
  }
}
</script>

<template>
  <br />
  <hr />
  <h1>Ephemeral Link Creation</h1>
  <label>
    Password:
    <input v-model="password" />
  </label>
  <br />
  <b v-if="message">
    {{ message }}
    <br />
  </b>
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="requestEphemeralLink"
  >
    Get EphemeralLink
  </button>
  <br />
  <div v-if="ephemeralHash">
    <a :href="ephemeralHash" @click.prevent>{{ ephemeralHash }}</a>
  </div>
  <hr />
  <br />
</template>
