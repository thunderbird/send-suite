<script setup>
import { ref, toRaw } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import init from '@/lib/init';
import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import Btn from '@/apps/lockbox/elements/Btn.vue';

const { api } = useApiStore();
const userStore = useUserStore();
const { keychain, resetKeychain } = useKeychainStore();
const folderStore = useFolderStore();

const sessionInfo = ref(null);

async function pingSession() {
  sessionInfo.value = (await api.call(`users/me`)) ?? `You need to log into your mozilla account`;
}

function formatSessionInfo(info) {
  console.log(info);
  if (!info) {
    return null;
  }
  const val = structuredClone(toRaw(info));
  if (!val.user) {
    return info;
  }
  for (let key in val.user) {
    console.log(`inspecting ${key}`);
    if (typeof val.user[key] == 'string' && val.user[key].length > 20) {
      val.user[key] = val.user[key].substring(0, 20) + '...';
    }
  }
  return JSON.stringify(val, null, 4);
}

// After mozilla account login, confirm that
// - we have a db user
// - the user has a public key
// - the user has a default folder for email attachments
async function dbUserSetup() {
  // Populate the user if they exist
  const didPopulate = await userStore.populateFromSession();
  if (!didPopulate) {
    console.warn(`DEBUG: could not retrieve user; did mozilla login fail?`);
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
      console.warn(`DEBUG: could not update user's public key`);
    }
  }

  // Existing init() handles
  await init(userStore.user, keychain, folderStore);
}

async function mozAcctLogin() {
  const url = await userStore.getMozAccountAuthUrl();
  if (!url) {
    console.warn(`DEBUG: couldn't get a mozilla auth url`);
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
  <BackupAndRestore />
  <br />
  <br />
  <Btn @click.prevent="pingSession">ping session</Btn>
  <br />
  <pre v-if="sessionInfo">
    {{ formatSessionInfo(sessionInfo) }}
  </pre>
</template>
