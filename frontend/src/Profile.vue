<script setup>
import { ref, onMounted } from 'vue';
import Debug from '@/Debug.vue';
import useApiStore from '@/stores/api-store';
const { api } = useApiStore();

const resp = ref(null);
const authUrl = ref('');

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('sessionId');
});

async function pingSession() {
  resp.value = await api.callApi(`debug-session`, {}, 'GET');
  console.log(`session from backend:`);
  console.log(resp.value);
}

async function loginToMozAccount() {
  // waitaminit...do I get a different session or the same if I open a new window?
  // Let's find out!
  // Get the auth url
  const resp = await api.callApi(`lockbox/fxa/login`);
  if (resp.url) {
    authUrl.value = resp.url;
    // redirect (can't open popup: you get a different session)
    // window.location = resp.url;
  }
}

async function openPopup() {
  try {
    await browser.windows.create({
      // url: browser.runtime.getURL(`${serverUrl.value}/lockbox/fxa/login?from=${window.location}`),
      url: authUrl.value,
      type: 'popup',
      allowScriptsToClose: true,
    });
  } catch (e) {
    console.log(`popup failed`);
    console.log(e);
  }
}
</script>
<template>
  <Debug />
  <h1>Hi.</h1>
  <button @click.prevent="loginToMozAccount">Get Moz Acct Auth URL</button>
  <br />
  <button v-if="authUrl" @click.prevent="openPopup">Click this button Moz Acct with {{ authUrl }}</button>
  <br />
  <a href="/lockbox/fxa/logout">Log out of FXA</a>
  <br />
  <button @click.prevent="pingSession">ping session</button>
  <br />
  <br />
  <br />
  <code v-if="resp">
    {{ resp }}
  </code>
</template>
