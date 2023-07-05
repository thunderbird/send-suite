<script setup>
import { ref, onMounted, nextTick, inject } from "vue";

import { storeUser, storeServerUrl } from "../lib/sync";

const { api, updateApiUrl } = inject("api");
const { user, updateUser } = inject("user");

// Create the `browser` object for use outside of TB.
const browser = window.browser ?? {};

// This specifies the id of the provider chosen in the
// "Composition > Attachments" window.
// This is necessary only for the management page.
let accountId = new URL(location.href).searchParams.get("accountId");

// Initialize the settings
browser.storage?.local.get([accountId]).then((accountInfo) => {
  setAccountConfigured(accountId);

  if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
    // input.value = accountInfo[accountId][SERVER];
    setAccountConfigured(accountId);
  }
});

function setAccountConfigured(id) {
  browser.cloudFile?.updateAccount(id, {
    configured: true,
  });
}

const debug = ref(null);
const serverUrl = ref(api.value.serverUrl);
const emailAddress = ref(user.value.email);
const messages = ref("");
const dlimit = ref(1);
const days = ref(1);
const hours = ref(0);
const minutes = ref(0);

function log(msg) {
  messages.value += "\n" + msg;
  nextTick(() => {
    debug.value.scrollTop = debug.value.scrollHeight;
  });
}

async function saveConfiguration() {
  log(`Storing server url`);
  storeServerUrl(serverUrl.value);
  updateApiUrl(serverUrl.value);

  log("Confirming user before saving config");
  let _user = await api.value.login(emailAddress.value);
  if (_user) {
    console.log(`user exists on server`);
    console.log(_user);
    storeUser(_user.email, _user.id);
    log(`Storing user ${_user.email} with id ${_user.id}`);
    log(`Updating user throughout Vue application`);
    updateUser(_user);
  } else {
    try {
      log(`User does not exist, attempting to create...`);
      const { email, id } = await api.value.createNewUser(emailAddress.value);
      log(`User created`);
      storeUser(email, id);
      log(`Storing user ${email} with id ${id}`);
    } catch (error) {
      console.log(`Couldn't create user, but does not exist on server 💩`);
      console.log(error);
    }
  }
}
</script>

<template>
  <form @submit.prevent="saveConfiguration">
    <label>
      (debug only) TB Send Server URL
      <input type="url" v-model="serverUrl" />
    </label>
    <br />
    <label>
      (debug only) TB Email Address
      <input type="email" v-model="emailAddress" />
    </label>
    <br />
    <label>
      Default download limit
      <input type="number" v-model="dlimit" disabled />
    </label>
    <br />
    <label>
      Default time limit
      <input type="number" v-model="days" disabled />
      <input type="number" v-model="hours" disabled />
      <input type="number" v-model="minutes" disabled />
    </label>
    <br />
    <input type="submit" value="save" />
  </form>
  <br />
  <br />
  <textarea ref="debug" v-model="messages"></textarea>
</template>

<style scoped>
textarea {
  width: 90%;
  height: 10em;
}
</style>
