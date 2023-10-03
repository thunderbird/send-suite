<script setup>
import { ref, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getContainerKeyFromChallenge } from '@/common/challenge.js';

const password = ref('');
const message = ref('');

const key = ref(null);

const route = useRoute();
const router = useRouter();

const api = inject('api');
const keychain = inject('keychain');
const user = inject('user');

watch(
  () => user.value.id,
  () => {
    console.log(user.value.id);
    console.log(`we have a logged-in user`);
  }
);

/*
- if there's a user logged in, add them to the group
  - NOTE: this should be moved to the server code
  - possibly when sending the correct challenge response
*/

async function accept() {
  const { unwrappedKey, containerId } = await getContainerKeyFromChallenge(
    route.params.hash,
    password.value,
    api,
    keychain
  );
  key.value = unwrappedKey;
  console.log(`unwrappedKey: ${unwrappedKey}`);
  console.log(`containerId: ${containerId}`);
  message.value = `and this is where we add the container to the group and then redirect`;

  let id;
  if (user.value.id) {
    console.log(`Using existing user id`);
    id = user.value.id;
  } else {
    // create an "anonymous" user and keys

    await keychain.value.rsa.generateKeyPair();
    const jwkPublicKey = await keychain.value.rsa.getPublicKeyJwk();
    let email = new Date().getTime() + '@example.com';
    email = email.substring(6);
    // const resp = await api.createUser(email, jwkPublicKey, true);
    const resp = await user.value.createUser(
      email,
      jwkPublicKey
    );
    if (!resp) {
      console.log(`could not creat user`)
      return;
    }
    id = resp.user.id;
    await user.value.store();
  }

  const addMemberResp = await api.addMemberToContainer(id, containerId);
  console.log(`adding user to convo`);
  console.log(addMemberResp);
  if (!addMemberResp) {
    return;
  }

  await keychain.value.add(containerId, unwrappedKey);
  await keychain.value.store();
  router.push('/lockbox');

}
</script>

<template>
  <h1>Lockbox share</h1>
  <template v-if="user.email">
    <p>
      Hello,
      {{ user.email }}
    </p>
  </template>
  <p>
    The hash:
    {{ route.params.hash }}
  </p>
  <label>
    Password:
    <input v-model="password" type="password" />
  </label>
  <div>
    {{ message }}
  </div>
  <button class="btn-primary" @click="accept">Go</button>
</template>
