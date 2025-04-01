<!-- eslint-disable no-undef -->
<script setup lang="ts">
import { dbUserSetup } from '@/lib/helpers';
import init from '@/lib/init';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { ref } from 'vue';

import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import FeedbackBox from '@/apps/common/FeedbackBox.vue';
import { useMetricsUpdate } from '@/apps/common/mixins/metrics';
import UserDashboard from '@/apps/common/UserDashboard.vue';
import Btn from '@/apps/send/elements/BtnComponent.vue';
import useFolderStore from '@/apps/send/stores/folder-store';
import { formatLoginURL } from '@/lib/helpers';
import { CLIENT_MESSAGES } from '@/lib/messages';
import { validateToken } from '@/lib/validations';
import useMetricsStore from '@/stores/metrics';
import { useQuery } from '@tanstack/vue-query';
import { ModalsContainer } from 'vue-final-modal';
import LoadingComponent from '../common/LoadingComponent.vue';
import SecureSendIcon from '../common/SecureSendIcon.vue';
import TBBanner from '../common/TBBanner.vue';
import { useExtensionStore } from './stores/extension-store';
import { useStatusStore } from './stores/status-store';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const { api } = useApiStore();
const folderStore = useFolderStore();
const { validators } = useStatusStore();
const { configureExtension } = useExtensionStore();
const { initializeClientMetrics, sendMetricsToBackend } = useMetricsStore();
const { updateMetricsIdentity } = useMetricsUpdate();

const sessionInfo = ref(null);
const isLoggedIn = ref(false);
const email = ref(null);
const userId = ref(null);

const { isLoading } = useQuery({
  queryKey: ['getLoginStatus'],
  queryFn: async () => await loadLogin(),
});

const loadLogin = async () => {
  // check local storage first
  await userStore.loadFromLocalStorage();

  try {
    // See if we already have a valid session.
    // If so, hydrate our user using session data.
    const didPopulate = await userStore.populateFromBackend();
    if (!didPopulate) {
      return;
    }
    // app-sepcific initialization
    await init(userStore, keychain, folderStore);
    // If init found anything in storage, populate our
    // debug ref vars with those values.
    email.value = userStore.user.email;
    userId.value = userStore.user.id;
    await finishLogin();
  } catch (e) {
    console.log(e);
  }

  // Identify user for analytics
  const uid = userStore?.user?.uniqueHash;
  initializeClientMetrics(uid);
  await sendMetricsToBackend(api);
};

updateMetricsIdentity();

async function openPopup(authUrl: string) {
  try {
    const popup = await browser.windows.create({
      url: formatLoginURL(authUrl),
      type: 'popup',
      allowScriptsToClose: true,
    });

    const checkPopupClosed = (windowId: number) => {
      if (windowId === popup.id) {
        browser.windows.onRemoved.removeListener(checkPopupClosed);
        finishLogin();
      }
    };
    browser.windows.onRemoved.addListener(checkPopupClosed);
  } catch (e) {
    console.log(`popup failed`);
    console.log(e);
  }
}

async function loginToMozAccount() {
  const resp = await api.call(`lockbox/fxa/login`);
  if (resp.url) {
    await openPopup(resp.url);
  }
}
async function showCurrentServerSession() {
  sessionInfo.value =
    (await api.call(`users/me`)) ?? CLIENT_MESSAGES.SHOULD_LOG_IN;
}

async function logOut() {
  await userStore.logOut();
  await validators();
  isLoggedIn.value = false;
}

async function finishLogin() {
  const isSessionValid = await validateToken(api);
  if (!isSessionValid) {
    return;
  }

  await showCurrentServerSession();
  await dbUserSetup(userStore, keychain, folderStore);
  // Save values to the ref variables.
  // Really only for debugging purposes.
  userId.value = userStore.user.id;
  email.value = userStore.user.email;
  const { isTokenValid, hasBackedUpKeys } = await validators();

  if (isTokenValid && hasBackedUpKeys) {
    try {
      await configureExtension();
    } catch (error) {
      console.warn('You are running this outside TB', error);
    }
  }

  isLoggedIn.value = isTokenValid;
  isLoggedIn.value = true;
}
</script>

<template>
  <div class="container">
    <TBBanner />
    <div v-if="isLoading">
      <LoadingComponent />
    </div>

    <div v-else>
      <div v-if="isLoggedIn">
        <UserDashboard :log-out="logOut" />
        <BackupAndRestore />
      </div>
      <div v-else>
        <Btn
          primary
          data-testid="login-button"
          @click.prevent="loginToMozAccount"
          >Log into Mozilla Account</Btn
        >
      </div>
    </div>

    <FeedbackBox />
    <SecureSendIcon />
    <ModalsContainer />
  </div>
</template>

<style scoped>
.container {
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
</style>
