<script setup lang="ts">
import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import Btn from '@/apps/lockbox/elements/Btn.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { formatSessionInfo, mozAcctLogin } from '@/lib/fxa';
import { dbUserSetup } from '@/lib/helpers';
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

async function onSuccess() {
  await dbUserSetup(userStore, keychain, folderStore);
  await pingSession();
}

async function logOut() {
  await userStore.logOut();
  location.reload();
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
  <Btn @click.prevent="logOut">Log out</Btn>
</template>
