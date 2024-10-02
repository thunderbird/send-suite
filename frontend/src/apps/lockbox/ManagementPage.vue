<!-- eslint-disable no-undef -->
<script setup lang="ts">
import init from '@/lib/init';
import useApiStore from '@/stores/api-store';
import useConfigurationStore from '@/stores/configuration-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { onMounted, ref, toRaw } from 'vue';

import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import FeedbackBox from '@/apps/common/FeedbackBox.vue';
import { useMetricsUpdate } from '@/apps/common/mixins/metrics';
import Btn from '@/apps/lockbox/elements/Btn.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { formatLoginURL } from '@/lib/helpers';
import { CLIENT_MESSAGES } from '@/lib/messages';
import useMetricsStore from '@/stores/metrics';

const DEBUG = true;
const SERVER = `server`;

const userStore = useUserStore();
const { keychain, resetKeychain } = useKeychainStore();
const { api } = useApiStore();
const folderStore = useFolderStore();
const { initializeClientMetrics, sendMetricsToBackend } = useMetricsStore();
const { updateMetricsIdentity } = useMetricsUpdate();
const configurationStore = useConfigurationStore();

const authUrl = ref('');
const sessionInfo = ref(null);

const salutation = ref('');
const isLoggedIn = ref(false);

configurationStore.$onAction(() => {
  console.log(`the serverUrl is ${configurationStore.serverUrl}`);
});

const currentServerUrl = ref(configurationStore.serverUrl);
const email = ref(null);
const userId = ref(null);

// This specifies the id of the provider chosen in the
// "Composition > Attachments" window.
// This is necessary only for the management page.
const accountId = new URL(location.href).searchParams.get('accountId');

function setAccountConfigured(accountId) {
  // Let TB know that extension is ready for use with cloudFile API.
  try {
    //@ts-ignore
    browser.cloudFile.updateAccount(accountId, {
      configured: true,
    });
  } catch (e) {
    console.log(
      `setAccountConfigured: You're probably running this outside of Thundebird`
    );
  }
}

async function configureExtension() {
  console.log(`

  Configuring extension with:

  accountId: ${accountId}
  SERVER: ${SERVER}
  currentServerUrl.value: ${currentServerUrl.value}

  `);

  return browser.storage.local
    .set({
      [accountId]: {
        [SERVER]: currentServerUrl.value,
      },
    })
    .catch((error) => {
      console.log(error);
    })
    .then(() => {
      setAccountConfigured(accountId);
      configurationStore.setServerUrl(currentServerUrl.value);
      DEBUG &&
        browser.storage.local.get(accountId).then((accountInfo) => {
          if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
            configurationStore.setServerUrl(accountInfo[accountId][SERVER]);
            setAccountConfigured(accountId);
          } else {
            console.log(`You probably need to wait longer`);
          }
        });
    });
}

// Initialize the settings
onMounted(async () => {
  salutation.value = 'Please log in.';
  try {
    // See if we already have a valid session.
    // If so, hydrate our user using session data.
    const didPopulate = await userStore.populateFromSession();
    if (!didPopulate) {
      console.warn(`DEBUG: could not retrieve user; did mozilla login fail?`);
      return;
    }
    // app-sepcific initialization
    await init(userStore, keychain, folderStore);
    // If init found anything in storage, populate our
    // debug ref vars with those values.
    email.value = userStore.user.email;
    userId.value = userStore.user.id;
  } catch (e) {
    console.log(e);
  }
  try {
    // extension-specific initialization
    await configureExtension();
  } catch (e) {
    console.log(
      `extension init: You're probably running this outside of Thundebird`
    );
  }
  salutation.value = 'You are logged into your Mozilla Account';
  isLoggedIn.value = true;
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
    console.warn(`DEBUG: could not retrieve user; did mozilla login fail?`);
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

async function openPopup() {
  try {
    await browser.windows.create({
      url: formatLoginURL(authUrl.value),
      type: 'popup',
      allowScriptsToClose: true,
    });
    /*
TODO: I need to start an interval that pings the server.
It should ask if the current code has just been used to successfully log in.
If so, we should grab the login information from the server and popuplate the local user-store.

And, we should show that information here instead of showing the login button.
    */
  } catch (e) {
    console.log(`popup failed`);
    console.log(e);
  }
}

async function finishLogin() {
  await showCurrentServerSession();
  await dbUserSetup();
  await configureExtension();

  // TODO: confirm that I am saving the user and keys when I init() (which is in dbUserSetup)
  salutation.value = 'You are logged into your Mozilla Account';
  isLoggedIn.value = true;
}
</script>

<template>
  <h1>{{ salutation }}</h1>
  <button @click.prevent="loginToMozAccount">Log into Mozilla Account</button>
  <button @click.prevent="finishLogin">Click after moz login</button>
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
