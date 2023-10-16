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
const keychainRef = inject('keychainRef');
const userRef = inject('userRef');

watch(
  () => userRef.value.id,
  () => {
    console.log(userRef.value.id);
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
    keychainRef
  );
  key.value = unwrappedKey;
  console.log(`unwrappedKey: ${unwrappedKey}`);
  console.log(`containerId: ${containerId}`);
  message.value = `and this is where we add the container to the group and then redirect`;

  let id;
  if (userRef.value.id) {
    console.log(`Using existing user id`);
    id = userRef.value.id;
  } else {
    // create an "anonymous" user and keys

    await keychainRef.value.rsa.generateKeyPair();
    const jwkPublicKey = await keychainRef.value.rsa.getPublicKeyJwk();
    let email = new Date().getTime() + '@example.com';
    email = email.substring(6);
    // const resp = await api.createUser(email, jwkPublicKey, true);
    const resp = await userRef.value.createUser(email, jwkPublicKey);
    if (!resp) {
      console.log(`could not creat user`);
      return;
    }
    id = resp.user.id;
    await userRef.value.store();
  }

  const addMemberResp = await api.addMemberToContainer(id, containerId);
  console.log(`adding user to convo`);
  console.log(addMemberResp);
  if (!addMemberResp) {
    return;
  }

  await keychainRef.value.add(containerId, unwrappedKey);
  await keychainRef.value.store();
  router.push('/lockbox');
}
</script>

<template>
  <h1>Lockbox share</h1>
  <template v-if="userRef.email">
    <p>
      Hello,
      {{ userRef.email }}
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
