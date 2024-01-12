<script setup>
import { ref } from 'vue';
import useConfigurationStore from '@/stores/configuration-store';

const DEBUG = true;
const SERVER = `server`;

const configurationStore = useConfigurationStore();
configurationStore.$onAction((actionInfo) => {
  // console.log(actionInfo);
  console.log(`the serverUrl is ${configurationStore.serverUrl}`);
});

const currentServerUrl = ref(configurationStore.serverUrl);

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
(function init() {
  try {
    browser.storage.local.get([accountId]).then((accountInfo) => {
      if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
        configurationStore.setServerUrl(accountInfo[accountId][SERVER]);
        setAccountConfigured(accountId);
      }
    });
  } catch (e) {
    console.log(`init: You're probably running this outside of Thundebird`);
  }
})();

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
        browser.storage.local.get([accountId]).then((accountInfo) => {
          if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
            const isSame = currentServerUrl.value == accountInfo[accountId][SERVER];
            console.log(`Saved is same as current?? e.g., did we update? ${isSame}`);
          } else {
            console.log(`You probably need to wait longer`);
          }
        });
    });
}

async function save() {
  try {
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
      Server URL
      <input type="url" v-model="currentServerUrl" />
    </label>
    <div style="text-align: right">
      <button type="submit" @click.prevent="save">Save</button>
    </div>
  </form>
</template>

<style scoped>
form {
  max-width: 80%;

  input {
    width: 100%;
  }
}
</style>
