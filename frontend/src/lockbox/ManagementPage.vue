<script setup>
import { ref, onMounted, toRaw } from 'vue';
import init from '@/lib/init';
import { Storage } from '@/lib/storage';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';
import useConfigurationStore from '@/stores/configuration-store';
import useApiStore from '@/stores/api-store';

import BackupAndRestore from '@/common/components/BackupAndRestore.vue';
import Btn from '@/lockbox/elements/Btn.vue';
const DEBUG = true;
const SERVER = `server`;

const storage = new Storage();
const { user } = useUserStore();
const userStore = useUserStore();
const { keychain, resetKeychain } = useKeychainStore();
const { api } = useApiStore();
const folderStore = useFolderStore();
const configurationStore = useConfigurationStore();

const resp = ref(null);
const authUrl = ref('');
const sessionInfo = ref(null);

configurationStore.$onAction((actionInfo) => {
  // console.log(actionInfo);
  console.log(`the serverUrl is ${configurationStore.serverUrl}`);
});

const currentServerUrl = ref(configurationStore.serverUrl);
const email = ref(null);
const userId = ref(null);
const jwkPublicKey = ref('');

// This specifies the id of the provider chosen in the
// "Composition > Attachments" window.
// This is necessary only for the management page.
const accountId = new URL(location.href).searchParams.get('accountId');

function setAccountConfigured(accountId) {
  try {
    browser.cloudFile.updateAccount(accountId, {
      configured: true,
    });
  } catch (e) {
    console.log(`setAccountConfigured: You're probably running this outside of Thundebird`);
  }
}

// Initialize the settings
onMounted(async () => {
  try {
    // app-sepcific initialization
    await init(user, keychain, folderStore);
    email.value = user.email;
    userId.value = user.id;

    // extension-specific initialization
    browser.storage.local.get(accountId).then((accountInfo) => {
      if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
        configurationStore.setServerUrl(accountInfo[accountId][SERVER]);
        setAccountConfigured(accountId);
      }
    });
  } catch (e) {
    console.log(`extension init: You're probably running this outside of Thundebird`);
  }
});

async function configureExtension() {
  // TODO: disable the input and submit button
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
      // TODO: enable the input and submit button
      setAccountConfigured(accountId);
      configurationStore.setServerUrl(currentServerUrl.value);
      DEBUG &&
        browser.storage.local.get(accountId).then((accountInfo) => {
          if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
            const isSame = currentServerUrl.value == accountInfo[accountId][SERVER];
            console.log(`Saved is same as current?? e.g., did we update? ${isSame}`);
          } else {
            console.log(`You probably need to wait longer`);
          }
        });
    });
}

async function clean() {
  storage.clear();
  resetKeychain();
  await folderStore.init();
  folderStore.print();
}

async function logout() {
  await clean();
  email.value = '';
  userId.value = '';
  jwkPublicKey.value = '';
}

async function login() {
  if (!email.value) {
    alert('email address is required for login');
    return;
  }
  if (email.value !== user.email) {
    console.log(`we're logging in as a different user. cleaning up and starting fresh`);
    await clean();
    await keychain.rsa.generateKeyPair();
    await keychain.store();
  }

  const loginResp = await user.login(email.value);
  if (!loginResp) {
    console.log(`could not log in, trying to create`);

    jwkPublicKey.value = JSON.stringify(await keychain.rsa.getPublicKeyJwk());
    const createUserResp = await user.createUser(email.value, jwkPublicKey.value);
    if (!createUserResp) {
      console.log(`could not create user either. that's pretty bad`);
      alert(`could neither log in nor create user`);
      return;
    }

    user.id = createUserResp.user.id;
    user.email = createUserResp.user.email;
  }
  // save user to storage
  console.log(`storing new user with id ${user.id}`);
  await user.store();
  // then do the normal init (which should also log us in, possibly for a second time)
  await init(user, keychain, folderStore);

  // put our results in the form
  email.value = user.email;
  userId.value = user.id;
  console.log(`finished login on ManagementPage.vue`);
}

async function save() {
  try {
    // app-specific config
    await login();

    // extension-specific config
    await configureExtension();
  } catch (e) {
    console.log(`save: You're probably running this outside of Thundebird`);
  }
}

async function dbUserSetup() {
  // Populate the user if they exist
  const didPopulate = await userStore.populateFromSession();
  if (!didPopulate) {
    console.warn(`DEBUG: could not retrieve user; did mozilla login fail?`);
    return;
  }
  userStore.user.store();
  user.id = userStore.user.id;
  user.email = userStore.user.email;

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

async function loginToMozAccount() {
  // waitaminit...do I get a different session or the same if I open a new window?
  // Let's find out!
  // Get the auth url
  const resp = await api.callApi(`lockbox/fxa/login`);
  if (resp.url) {
    authUrl.value = resp.url;
    openPopup();
    // redirect (can't open popup: you get a different session)
    // window.location = resp.url;
  }
}
async function pingSession() {
  sessionInfo.value = (await api.callApi(`users/me`)) ?? `You need to log into your mozilla account`;
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
      // url: browser.runtime.getURL(`${serverUrl.value}/lockbox/fxa/login?from=${window.location}`),
      url: authUrl.value,
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
  await pingSession();
  await dbUserSetup();
  await configureExtension();
}
</script>

<template>
  <h1>Settings</h1>
  <form>
    <label>
      Server URL:
      <input type="url" v-model="currentServerUrl" />
    </label>
    <label>
      Email:
      <input type="url" v-model="email" />
    </label>
    <p v-if="userId">User ID: {{ userId }}</p>
    <div style="text-align: right">
      <button type="submit" @click.prevent="save">Save</button>
    </div>
  </form>
  <h1>Hi.</h1>
  <button @click.prevent="loginToMozAccount">Log into Mozilla Account</button>
  <button @click.prevent="finishLogin">Click after moz login</button>
  <!-- <br />
  <button v-if="authUrl" @click.prevent="openPopup">Click this button Moz Acct with {{ authUrl }}</button> -->
  <br />
  <BackupAndRestore />
  <Btn @click.prevent="pingSession">ping session</Btn>
  <br />
  <pre v-if="sessionInfo">
    {{ formatSessionInfo(sessionInfo) }}
  </pre>
</template>

<style scoped>
form {
  max-width: 80%;

  input {
    width: 100%;
  }
}
</style>
