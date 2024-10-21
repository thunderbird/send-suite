<!-- eslint-disable no-undef -->
<script setup lang="ts">
import init from '@/lib/init';
import useApiStore from '@/stores/api-store';
import useConfigurationStore from '@/stores/configuration-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { onMounted, ref } from 'vue';

import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import FeedbackBox from '@/apps/common/FeedbackBox.vue';
import { useMetricsUpdate } from '@/apps/common/mixins/metrics';
import Btn from '@/apps/lockbox/elements/Btn.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { formatSessionInfo } from '@/lib/fxa';
import { formatLoginURL } from '@/lib/helpers';
import { CLIENT_MESSAGES } from '@/lib/messages';
import { validateToken } from '@/lib/validations';
import useMetricsStore from '@/stores/metrics';
import { useExtensionStore } from './stores/extension-store';
import { useStatusStore } from './stores/status-store';

const userStore = useUserStore();
const { keychain, resetKeychain } = useKeychainStore();
const { api } = useApiStore();
const folderStore = useFolderStore();
const { validators } = useStatusStore();
const { configureExtension } = useExtensionStore();
const { initializeClientMetrics, sendMetricsToBackend } = useMetricsStore();
const { updateMetricsIdentity } = useMetricsUpdate();
const configurationStore = useConfigurationStore();

const authUrl = ref('');
const sessionInfo = ref(null);

const salutation = ref('');
const isLoggedIn = ref(false);

const currentServerUrl = ref(configurationStore.serverUrl);
const email = ref(null);
const userId = ref(null);

// Initialize the settings
onMounted(async () => {
  salutation.value = 'Please log in.';
  // check local storage first
  await userStore.load();

  try {
    // See if we already have a valid session.
    // If so, hydrate our user using session data.
    const didPopulate = await userStore.populateFromSession();
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
  const uid = userStore.user.uniqueHash;
  initializeClientMetrics(uid);
  await sendMetricsToBackend(api);
});

updateMetricsIdentity();

// Unused for now, but will need when implementing logout.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clean() {
  // TODO: make sure we clear the stored user and stored keychain.
  // Might need to add functions to keychainStore.

  resetKeychain();
  folderStore.init();
  folderStore.print();
}

async function dbUserSetup() {
  // Populate the user from the session.
  const didPopulate = await userStore.populateFromSession();
  if (!didPopulate) {
    return;
  }
  // Store the user we got by populating from session.
  userStore.store();

  await sendMetricsToBackend(api);

  // Check if we got our public key from the session.
  // If not, this is almost certainly a new user.
  const publicKey = await userStore.getPublicKey();
  if (!publicKey) {
    // New user needs a keypair.
    await keychain.rsa.generateKeyPair();
    await keychain.store();

    const jwkPublicKey = await keychain.rsa.getPublicKeyJwk();
    const didUpdate = await userStore.updatePublicKey(jwkPublicKey);
    if (!didUpdate) {
      console.warn(`DEBUG: could not update user's public key`);
    }
  }

  // When we call `init()`, it takes care of:
  // - loading user from storage
  // - loading keychain from storage
  // - creating the default folder
  await init(userStore, keychain, folderStore);

  // Save values to the ref variables.
  // Really only for debugging purposes.
  userId.value = userStore.user.id;
  email.value = userStore.user.email;
}

async function loginToMozAccount() {
  const resp = await api.call(`lockbox/fxa/login`);
  if (resp.url) {
    authUrl.value = resp.url;
    openPopup();
  }
}
async function showCurrentServerSession() {
  sessionInfo.value =
    (await api.call(`users/me`)) ?? CLIENT_MESSAGES.SHOULD_LOG_IN;
}

async function openPopup() {
  try {
    const popup = await browser.windows.create({
      url: formatLoginURL(authUrl.value),
      type: 'popup',
      allowScriptsToClose: true,
    });

    const checkPopupClosed = (windowId: number) => {
      if (windowId === popup.id) {
        browser.windows.onRemoved.removeListener(checkPopupClosed);
        finishLogin({ onClick: true });
      }
    };
    browser.windows.onRemoved.addListener(checkPopupClosed);
  } catch (e) {
    console.log(`popup failed`);
    console.log(e);
  }
}

type Options = { onClick: boolean };
async function finishLogin(options?: Options) {
  if (options?.onClick) {
    await api.requestAuthToken();
  }

  const isSessionValid = await validateToken(api);
  if (!isSessionValid) {
    salutation.value = `Please log in again, your session is invalid`;
    return;
  }

  await showCurrentServerSession();
  await dbUserSetup();
  const { isTokenValid, hasBackedUpKeys } = await validators();

  if (isTokenValid && hasBackedUpKeys) {
    try {
      await configureExtension();
    } catch (error) {
      console.warn('You are running this outside TB');
    }
  }

  isLoggedIn.value = isTokenValid;
  // TODO: confirm that I am saving the user and keys when I init() (which is in dbUserSetup)
  salutation.value = 'You are logged into your Mozilla Account';
  isLoggedIn.value = true;
}
</script>

<template>
  <h1>{{ salutation }}</h1>
  <button @click.prevent="loginToMozAccount">Log into Mozilla Account</button>
  <button @click.prevent="finishLogin({ onClick: true })">
    Click after moz login
  </button>
  <br />
  <h1>Debug Info</h1>
  <form>
    <label>
      Server URL:
      <input v-model="currentServerUrl" disabled />
    </label>
    <label>
      Email:
      <input v-model="email" disabled />
    </label>
    <label>
      User ID:
      <input v-model="userId" disabled />
    </label>
  </form>
  <br />
  <div v-if="isLoggedIn">
    <BackupAndRestore />
  </div>
  <Btn @click.prevent="showCurrentServerSession">ping session</Btn>
  <br />
  <pre v-if="sessionInfo">
    {{ formatSessionInfo(sessionInfo) }}
  </pre>
  <FeedbackBox />
</template>

<style scoped>
form {
  max-width: 80%;

  input {
    width: 100%;
  }
}
</style>
