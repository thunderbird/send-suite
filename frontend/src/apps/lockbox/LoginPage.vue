<script setup lang="ts">
import Btn from '@/apps/lockbox/elements/Btn.vue';
import { formatSessionInfo, mozAcctLogin } from '@/lib/fxa';
import { CLIENT_MESSAGES } from '@/lib/messages';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const { api } = useApiStore();
const { user } = useUserStore();

const router = useRouter();

const sessionInfo = ref(null);

async function pingSession() {
  sessionInfo.value =
    (await api.call(`users/me`)) ?? CLIENT_MESSAGES.SHOULD_LOG_IN;
  if (sessionInfo.value) {
    router.push('/lockbox/profile');
  }
}

function onSuccess() {
  pingSession();
}
</script>
<template>
  <p v-if="user?.id">Your session has expired, please log back in</p>
  <br />
  <Btn @click.prevent="mozAcctLogin(onSuccess)">Log into Moz Acct</Btn>
  <br />
  <Btn @click.prevent="pingSession">ping session</Btn>
  <br />
  <pre v-if="sessionInfo">
    {{ formatSessionInfo(sessionInfo) }}
  </pre>
</template>
