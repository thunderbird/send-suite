<script setup lang="ts">
import Btn from '@/apps/lockbox/elements/BtnComponent.vue';
import { mozAcctLogin } from '@/lib/fxa';
import { dbUserSetup } from '@/lib/helpers';
import { CLIENT_MESSAGES } from '@/lib/messages';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import FeedbackBox from '../common/FeedbackBox.vue';
import SecureSendIcon from '../common/SecureSendIcon.vue';
import StatusBar from '../common/StatusBar.vue';
import TBBanner from '../common/TBBanner.vue';
import useFolderStore from './stores/folder-store';

const { api } = useApiStore();
const { user } = useUserStore();
const userStore = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

const router = useRouter();

const sessionInfo = ref(null);

async function pingSession() {
  const session = await api.call<null | string>(`users/me`);

  sessionInfo.value = session ?? CLIENT_MESSAGES.SHOULD_LOG_IN;

  if (sessionInfo.value) {
    router.push('/lockbox/profile');
  }
}

async function onSuccess() {
  await dbUserSetup(userStore, keychain, folderStore);
  await pingSession();
}
</script>
<template>
  <main class="container">
    <TBBanner />
    <h2>Account</h2>
    <p>You’ll need to login to your Mozilla account to use Thunderbird Send</p>
    <p v-if="user?.id">Your session has expired, please log back in</p>
    <Btn primary @click.prevent="mozAcctLogin(onSuccess)"
      >Login to Mozilla Account</Btn
    >
    <FeedbackBox />
    <SecureSendIcon />
    <StatusBar />
  </main>
</template>

<style scoped>
.container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  gap: 1rem 0;
  margin-top: 2rem;
}
p {
  color: #000;
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}
h2 {
  font-size: 22px;
}
</style>
