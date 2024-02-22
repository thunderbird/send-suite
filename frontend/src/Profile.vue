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
</script>
<template>
  <Debug />
  <h1>Hi.</h1>
  <button @click.prevent="loginToMozAccount">Get Moz Acct Auth URL</button>
  <br />
  <a v-if="authUrl" :href="authUrl">Log in to Moz Acct with {{ authUrl }}</a>
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
