<script setup>
import { ref } from 'vue';

const DEBUG = true;
const SERVER = `server`;

const serverUrl = ref('https://localhost:8088');

// This specifies the id of the provider chosen in the
// "Composition > Attachments" window.
// This is necessary only for the management page.
const accountId = new URL(location.href).searchParams.get("accountId");

function setAccountConfigured(accountId) {
  browser.cloudFile.updateAccount(accountId, {
    configured: true,
  });
}

// Initialize the settings
browser.storage.local.get([accountId]).then((accountInfo) => {
  if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
    serverUrl.value = accountInfo[accountId][SERVER];
    setAccountConfigured(accountId);
  }
});

async function save() {
  // TODO: disable the input and submit button
  await browser.storage.local
    .set({
      [accountId]: {
        [SERVER]: serverUrl.value,
      },
    })
    .catch((error) => {
      console.log(error);
    })
    .then(() => {
      // TODO: enable the input and submit button
      setAccountConfigured(accountId);
      DEBUG &&
        browser.storage.local.get([accountId]).then((accountInfo) => {
          if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
            const isSame = serverUrl.value == accountInfo[accountId][SERVER];
            console.log(
              `Saved is same as current?? e.g., did we update? ${isSame}`
            );
          } else {
            console.log(`You probably need to wait longer`);
          }
        });
    });
}

</script>

<template>
  <h1>Settings</h1>
  <form>
    <label>Server URL
      <input type="url" v-model="serverUrl" />
    </label>
    <div style="text-align: right">
      <button type="submit" @click.prevent="save">
        Save
      </button>
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