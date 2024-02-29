<script setup>
import { ref } from 'vue';

import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';
import init from '@/lib/init';
import Btn from '@/lockbox/elements/Btn.vue';

const { api } = useApiStore();
const userStore = useUserStore();
const { keychain, resetKeychain } = useKeychainStore();
const folderStore = useFolderStore();

const sessionInfo = ref(null);

async function pingSession() {
  sessionInfo.value = await api.callApi(`users/me`);
}

// After mozilla account login, confirm that
// - we have a db user
// - the user has a public key
// - the user has a default folder for email attachments
async function dbUserSetup() {
  // Populate the user if they exist
  const didPopulate = await userStore.populateFromSession();
  if (!didPopulate) {
    alert(`DEBUG: could not retrieve user; did mozilla login fail?`);
    return;
  }
  userStore.user.store();

  // Check if the user has a public key.
  // If not, this is almost certainly a new user.
  const publicKey = await userStore.getPublicKey();
  if (!publicKey) {
    await keychain.rsa.generateKeyPair();
    await keychain.store();

    const jwkPublicKey = await keychain.rsa.getPublicKeyJwk();
    const didUpdate = await userStore.updatePublicKey(jwkPublicKey);
    if (!didUpdate) {
      alert(`DEBUG: could not update user's public key`);
    }
  }

  // Existing init() handles
  await init(userStore.user, keychain, folderStore);
}

async function mozAcctLogin() {
  const url = await userStore.getMozAccountAuthUrl();
  if (!url) {
    alert(`DEBUG: couldn't get a mozilla auth url`);
  }
  const win = window.open(url);
  const timer = setInterval(() => {
    if (win.closed) {
      clearInterval(timer);

      // debug: show fresh login info from session
      pingSession();
      dbUserSetup();
    }
  }, 500);
}
</script>
<template>
  <Btn @click.prevent="mozAcctLogin">Log into Moz Acct</Btn>
  <br />
  <!-- <a href="/lockbox/fxa/logout">Log out of FXA</a> -->
  <!-- <br /> -->
  <Btn @click.prevent="pingSession">ping session</Btn>
  <br />
  <br />
  <br />
  <pre v-if="sessionInfo">
    {{ JSON.stringify(sessionInfo, null, 4) }}
  </pre>
</template>
