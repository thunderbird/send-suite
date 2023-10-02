<script setup>
import { ref, inject, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import { Util } from '@/lib/keychain';
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
ok, what's my goal here?
I need to:
- read the hash
- let them put in a password
- get and respond to the challenge
- get the container key

scenario 1: one-off download
  this is good for email recipients
  and I should start here

  do I redirect them to a folder view?
  do I just request the folder contents right here?
  seems like it's better to go to a folder view for this share

  however, the folder view doesn't show the download link (yet)

  question: do I want to add that now?
  but the code for downloading would need to be moved to the `@/common` folder...


  so I need to:
  - [x] abstract out the download function
    - done, it's already part of filesync.js

  other functions that might be useful:
  - list files in a single folder
  - get file info for a single file


  Things to figure out:
  -



scenario 2:
- if there's a user logged in, add them to the group
  - NOTE: this should be done entirely on the server
  - possibly when sending the correct challenge response
- then redirect them to the folder view, focused on this folder

I think scenario 2 is going to be easier...

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
  }

  const addMemberResp = await api.addMemberToContainer(id, containerId);
  console.log(`adding user to convo`);
  console.log(addMemberResp);
  if (!addMemberResp) {
    return;
  }

  // - [X] store the unwrappedKey under challengeResp.containerId
  await keychain.value.add(containerId, unwrappedKey);
  // await keychain.store();
  router.push('/lockbox');

}
</script>

<template>
  <h1>This This is where the cookies go</h1>
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
