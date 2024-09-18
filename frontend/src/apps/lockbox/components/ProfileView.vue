<script setup lang="ts">
import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import Btn from '@/apps/lockbox/elements/Btn.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { formatSessionInfo, mozAcctLogin } from '@/lib/fxa';
import init from '@/lib/init';
import { CLIENT_MESSAGES } from '@/lib/messages';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { ref } from 'vue';

const { api } = useApiStore();
const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

const sessionInfo = ref(null);

async function pingSession() {
  sessionInfo.value =
    (await api.call(`users/me`)) ?? CLIENT_MESSAGES.SHOULD_LOG_IN;
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
  userStore.store();

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
  await init(userStore, keychain, folderStore);
}

function onSuccess() {
  pingSession();
  dbUserSetup();
}
</script>
<template>
  <Btn @click.prevent="mozAcctLogin(onSuccess)">Log into Moz Acct</Btn>
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
