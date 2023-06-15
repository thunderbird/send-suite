<script setup>
import { ref, onMounted, nextTick } from "vue";
import { createNewUser, login } from "../lib/api";
import { get, set } from "../lib/sync";
import { keyFor } from "../lib/const";

// Create the `browser` object for use outside of TB.
const browser = window.browser ?? {};

// This specifies the id of the provider chosen in the
// "Composition > Attachments" window.
// This is necessary only for the management page.
let accountId = new URL(location.href).searchParams.get("accountId");

// Initialize the settings
browser.storage?.local.get([accountId]).then((accountInfo) => {
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

function storeUser(email, id) {
  set(keyFor("user"), { email, id });
  log(`Storing user ${email} with id ${id}`);
}

async function saveConfiguration() {
  log("Confirming user before saving config");
  // check for user
  let user = await login(emailAddress.value);
  if (user) {
    console.log(`user exists on server`);
    console.log(user);
    storeUser(user.email, user.id);
  } else {
    try {
      log(`User does not exist, attempting to create...`);
      const { email, id } = await createNewUser(emailAddress.value);
      log(`User created`);
      storeUser(email, id);
    } catch (error) {
      console.log(`Couldn't create user...maybe already exists?`);
      console.log(error);
    }
  }
  // create if they don't exist

  // const resp = await createNewUser(emailAddress.value);
  // if (resp) {
  //   const { email, id } = resp;
  //   set(keyFor("user"), { email, id });
  //   log(`User ${email} with id ${id}`);
  // } else {
  //   console.log(`Couldn't create user...maybe already exists?`);
  // }
  // else, show an error
}

onMounted(() => {
  setAccountConfigured(accountId);
  log("Checking storage for user.");
  const obj = get(keyFor("user"));
  if (obj) {
    const { email, id } = obj;
    log(`Loaded user ${email} with id ${id}`);
    emailAddress.value = email;
  } else {
    log(`No user found, please create one`);
  }
});
</script>

<template>
  <form @submit.prevent="saveConfiguration">
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
