<script setup>
import { ref, onMounted } from 'vue';
import Debug from '@/Debug.vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';
import Btn from '@/lockbox/elements/Btn.vue';

const { api } = useApiStore();
const userStore = useUserStore();
const { keychain, resetKeychain } = useKeychainStore();
const folderStore = useFolderStore();

const resp = ref(null);
const authUrl = ref('');

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('sessionId');
});

async function pingSession() {
  resp.value = await api.callApi(`debug-session`);
}

async function userLogin() {
  // Populate the user if they exist
  const didPopulate = await userStore.populate();
  if (!didPopulate) {
    alert(`DEBUG: could not retrieve user; did mozilla login fail?`);
    return;
  }

  // Check if the user has a public key.
  // If not, this is almost certainly a new user.
  // Explicitly passing user id, since no implicit route returns pubkey
  const pubkeyResp = await api.callApi(`users/publickey/${userStore.user.id}`);
  if (!pubkeyResp.publicKey) {
    await keychain.rsa.generateKeyPair();
    await keychain.store();
    const jwkPublicKey = await keychain.rsa.getPublicKeyJwk();
    const updateResp = await api.callApi(
      `users/publickey`,
      {
        publicKey: jwkPublicKey,
      },
      'POST'
    );
    if (!updateResp.update?.publicKey) {
      alert(`DEBUG: could not update user's public key`);
    }
  }

  // Create a default folder if it doesn't exist
  await folderStore.sync();
  if (!folderStore.defaultFolder) {
    const createFolderResp = await folderStore.createFolder('Default Folder');
    if (!createFolderResp?.id) {
      alert(`DEBUG: could not create a default`);
    }
  }
}

async function mozAcctLogin() {
  const resp = await api.callApi(`lockbox/fxa/login`);
  if (resp.url) {
    authUrl.value = resp.url;

    const win = window.open(resp.url);
    const timer = setInterval(() => {
      if (win.closed) {
        clearInterval(timer);
        // debug: show fresh login info from session
        pingSession();
        userLogin();
      }
    }, 1000);
  }
}
</script>
<template>
  <Debug />
  <h1>Hi.</h1>
  <Btn @click.prevent="mozAcctLogin">Log into Moz Acct</Btn>
  <br />
  <!-- <a href="/lockbox/fxa/logout">Log out of FXA</a> -->
  <!-- <br /> -->
  <Btn @click.prevent="pingSession">ping session</Btn>
  <br />
  <br />
  <br />
  <pre v-if="resp">
    {{ JSON.stringify(resp, null, 4) }}
  </pre>
</template>
