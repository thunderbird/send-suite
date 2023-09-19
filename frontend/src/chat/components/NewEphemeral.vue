<script setup>
import { ref, inject } from 'vue';
import { Util } from '@/lib/keychain';

const api = inject('api');
const { user } = inject('user');
const keychain = inject('keychain');
const messageSocket = inject('messageSocket');

const password = ref('abc');
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
    // await keychain.createAndAddContainerKey(id);
    await keychain.newKeyForContainer(id);
    // await keychain.store();

    // get the key (which unwraps it),
    const unwrappedKey = await keychain.get(id);

    // and password protect it
    const salt = Util.generateSalt();
    const passwordWrappedKeyStr = await keychain.password.wrapContainerKey(
      unwrappedKey,
      password.value,
      salt
    );

    const challengeKey = await keychain.challenge.generateKey();
    const challengeSalt = Util.generateSalt();

    const passwordWrappedChallengeKeyStr =
      await keychain.password.wrapContentKey(
        challengeKey,
        password.value,
        challengeSalt
      );

    const challengePlaintext = keychain.challenge.createChallenge();

    const challengeCiphertext = await keychain.challenge.encryptChallenge(
      challengePlaintext,
      challengeKey,
      challengeSalt
    );

    // convert salts to base64 strings
    const saltStr = Util.arrayBufferToBase64(salt);
    const challengeSaltStr = Util.arrayBufferToBase64(challengeSalt);
    // // Confirming the steps for accepting a challenge
    // // 0. convert the salt to an array buffer
    // const challengeSaltBuffer = Util.base64ToArrayBuffer(challengeSaltStr);
    // // 1. unwrap the challenge key by providing the password
    // const unwrappedChallengeKey = await keychain.password.unwrapContentKey(
    //   passwordWrappedChallengeKeyStr,
    //   password.value,
    //   challengeSalt
    // );

    // console.log(
    //   `is my unwrappedChallenge key equivalent to my original challengeKey?`
    // );
    // console.log(await Util.compareKeys(challengeKey, unwrappedChallengeKey));

    // // 2. decrypt the challenge text
    // const decryptedChallenge = await keychain.challenge.decryptChallenge(
    //   challengeCiphertext,
    //   unwrappedChallengeKey,
    //   // this unwrapped key cannot be used to decrypt....
    //   challengeSaltBuffer
    // );

    // console.log(
    //   `Can I decrypt the challenge? ${
    //     challengePlaintext === decryptedChallenge
    //   }`
    // );
    // with the password protected key and the salt, create an ephemeral link
    const resp = await api.createEphemeralLink(
      id,
      passwordWrappedKeyStr,
      saltStr,
      passwordWrappedChallengeKeyStr,
      challengeSaltStr,
      user.value.id,
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
      messageSocket.value.send(
        JSON.stringify({
          type: 'newChat',
          // conversationId: props.conversationId,
        })
      );
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
    <input v-model="password" type="password" />
  </label>
  <br />
  <b v-if="message">
    {{ message }}
    <br />
  </b>
  <button class="btn-primary" @click="requestEphemeralLink">
    Get EphemeralLink
  </button>
  <br />
  <div v-if="ephemeralHash">
    <a :href="ephemeralHash" @click.prevent>{{ ephemeralHash }}</a>
  </div>
  <hr />
  <br />
</template>

<style scoped>
a {
  text-decoration: underline;
  color: #990099;
}
</style>
