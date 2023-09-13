<script setup>
import { ref, watch, inject } from 'vue';
import { useRouter } from 'vue-router';
import { Util } from '@/lib/keychain';

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
  const { unwrappedKey, containerId } = await getContainerKeyFromChallenge();

  // this allows me to create a user?
  // next:
  // - [X] generate personal keys
  await keychain.rsa.generateKeyPair();
  console.log(`generating user key pair`);
  console.log(keychain.publicKey);
  // await keychain.store();
  // - [ ] create an api user (with public key)
  const jwkPublicKey = await keychain.rsa.getPublicKeyJwk();
  console.log(`here's my public key as jwk`);
  console.log(jwkPublicKey);

  let id;
  if (user?.value?.id) {
    console.log(`Using existing user id`);
    id = user.value.id;
    // debugger;
  } else {
    let email = new Date().getTime() + '@example.com';
    email = email.substring(6);
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
  // await keychain.store();

  // - [X] then...go to the conversation?
  emit('setConversationId', containerId);

  // - [ ] redirect to /ephemeral?
  router.push('/ephemeral');
}

async function getContainerKeyFromChallenge() {
  // call api at /api/ephemeral/:hash
  const resp = await api.getEphemeralLinkChallenge(props.hash);

  if (!resp) {
    console.log('uh oh');
    return;
  }

  // Step 1: receive the challenge
  // Renaming so it's clear that we're working with strings
  const {
    challengeKey: challengeKeyStr,
    challengeSalt: challengeSaltStr,
    challengeCiphertext,
  } = resp;

  // Step 2: convert to array buffers, as necessary.
  // Only the salt needs to be converted to an array buffer.
  // This is handled automatically by keychain.password.unwrapContentKey
  let challengeSalt;
  try {
    challengeSalt = Util.base64ToArrayBuffer(challengeSaltStr);
  } catch (e) {
    message.value = 'Link is not valid';
    return;
  }

  try {
    // Step 3: unwrap the challenge key using the password
    let unwrappedChallengeKey = await keychain.password.unwrapContentKey(
      challengeKeyStr,
      password.value,
      challengeSalt
    );

    // Step 4: decrypt the challenge ciphertext and send it back
    let challengePlaintext = await keychain.challenge.decryptChallenge(
      challengeCiphertext,
      unwrappedChallengeKey,
      challengeSalt
    );

    // Step 5: post the challenge text to receive:
    // - containerId
    // - wrapped container key
    // - salt (for unwrapping container key)
    const challengeResp = await api.acceptEphemeralLink(
      props.hash,
      challengePlaintext
    );

    if (!challengeResp.containerId) {
      throw Error('Challenge unsuccessful');
      return;
    }
    const {
      containerId,
      wrappedKey: wrappedKeyStr,
      salt: saltStr,
    } = challengeResp;

    // Step 6: unwrap the container key using the password
    const unwrappedKey = await keychain.password.unwrapContainerKey(
      wrappedKeyStr,
      password.value,
      Util.base64ToArrayBuffer(saltStr)
    );
    console.log(unwrappedKey);
    message.value = 'Successful challenge!';

    return { unwrappedKey, containerId };
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
  <!-- <label>
    Hash from the route:
    <input :value="props.hash" disabled />
  </label>
  <br /> -->
  <label>
    Password:
    <input v-model="password" type="password" />
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
