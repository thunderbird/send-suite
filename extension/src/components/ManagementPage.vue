<script setup>
import { ref, onMounted, nextTick } from "vue";
import { createNewUser, login } from "../lib/api";
import {
  loadUser,
  storeUser,
  loadServerUrl,
  storeServerUrl,
} from "../lib/sync";

/*

Since this component can get/set these values (and not just use them),
is this a good candidate for `inject`?

If it changes here, I need for it to update elsewhere (parents, siblings).

*/

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
const serverUrl = ref(null);
const emailAddress = ref(null);
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
  log("Confirming user before saving config");
  // check for user
  let user = await login(emailAddress.value);
  if (user) {
    console.log(`user exists on server`);
    console.log(user);
    storeUser(user.email, user.id);
    log(`Storing user ${user.email} with id ${user.id}`);
  } else {
    try {
      log(`User does not exist, attempting to create...`);
      const { email, id } = await createNewUser(emailAddress.value);
      log(`User created`);
      storeUser(email, id);
      log(`Storing user ${email} with id ${id}`);
    } catch (error) {
      console.log(`Couldn't create user...maybe already exists?`);
      console.log(error);
    }
  }
  log(`Storing server url`);
  storeServerUrl(serverUrl.value);
}

onMounted(() => {
  log("Checking storage for serverUrl");
  const url = loadServerUrl();
  serverUrl.value = url;
  setAccountConfigured(accountId);
  log("Checking storage for user.");
  try {
    const { email, id } = loadUser();
    log(`Loaded user ${email} with id ${id}`);
    emailAddress.value = email;
  } catch (error) {
    console.log(error);
  }
});
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
