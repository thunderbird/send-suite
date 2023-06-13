<script setup>
import { ref, onMounted, nextTick } from "vue";
import { createNewUser } from "../utils";
import { get, set } from "../lib/sync";
import { keyFor } from "../lib/const";

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

async function saveConfiguration() {
  // am I sending to the server now?
  log("Saving config");
  const resp = await createNewUser(emailAddress.value);
  if (resp) {
    const { email, id } = resp;
    set(keyFor("user"), { email, id });
    log(`User ${email} with id ${id}`);
  } else {
    console.log(`Couldn't create user...maybe already exists?`);
  }
}

onMounted(() => {
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
