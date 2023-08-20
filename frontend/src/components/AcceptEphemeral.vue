<script setup>
import { ref, watch, inject } from 'vue';
import { useRouter } from 'vue-router';

import {
  base64ToArrayBuffer,
  aesDecryptChallenge,
  passwordUnwrapAESKey,
} from '../lib/crypt';

const router = useRouter();

const api = inject('api');
const keychain = inject('keychain');
const { user, setUser, storeUser } = inject('user');

const password = ref('');
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
    if (!challengeResp.containerId) {
      throw Error('Challenge unsuccessful');
      return;
    }
    const { containerId } = challengeResp;
    message.value = 'Successful challenge!';

    // this allows me to create a user?
    // next:
    // - [X] generate personal keys
    await keychain.generateUserKeyPair();
    console.log(`generating user key pair`);
    console.log(keychain.publicKey);
    await keychain.store();
    // - [ ] create an api user (with public key)
    const jwkPublicKey = JSON.stringify(await keychain.getUserPublicKeyJwk());
    console.log(`here's my public key as jwk`);
    console.log(jwkPublicKey);

    let id;
    if (user?.value?.id) {
      console.log(`Using existing user id`);
      id = user.value.id;
      debugger;
    } else {
      const email = new Date().getTime() + '@example.com';
      const resp = await api.createUser(email, jwkPublicKey, true);
      if (resp) {
        id = resp.user.id;

        // - [X] store user info to localStorage
        setUser({
          id,
          email,
        });
        storeUser(id, email);
      }
    }

    // - [X] add user to the conversation id
    const addMemberResp = await api.addMemberToContainer(id, containerId);
    console.log(`adding user to convo`);
    console.log(addMemberResp);

    // - [X] store the unwrappedKey under challengeResp.containerId
    await keychain.add(containerId, unwrappedKey);
    await keychain.store();

    // - [X] then...go to the conversation?
    emit('setConversationId', containerId);

    // - [ ] redirect to /ephemeral?
    router.push('/ephemeral');
  } catch (e) {
    message.value = 'Incorrect hash or password';
    console.log(e);
    return;
  }
}

watch(user, () => {
  console.log(`accept ephemeral sees user 🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉 with id:`);
  console.log(user.value.id);
  // for now, sort the keys alphabetically to get the latest one
  // const conversationIds = Object.keys(keychain.keys).sort();
  // const mostRecentId = conversationIds[conversationIds.length - 1];
  // if (mostRecentId) {
  //   // setConversationId(mostRecentId);
  //   emit(`setConversationId`, mostRecentId);
  // }
});
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
