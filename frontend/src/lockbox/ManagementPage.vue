<script setup>
import { ref, onMounted } from 'vue';
import init from '@/lib/init';
import { Storage } from '@/lib/storage';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';
import useConfigurationStore from '@/stores/configuration-store';
import BackupAndRestore from '@/common/components/BackupAndRestore.vue';

const DEBUG = true;
const SERVER = `server`;

const storage = new Storage();
const { user } = useUserStore();
const { keychain, resetKeychain } = useKeychainStore();
const folderStore = useFolderStore();
const configurationStore = useConfigurationStore();
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
  <button @click="logout">log out</button>
  <br />
  <a href="fxa/login">FXA Login</a>
  <BackupAndRestore />
</template>

<style scoped>
form {
  max-width: 80%;

  input {
    width: 100%;
  }
}
</style>
