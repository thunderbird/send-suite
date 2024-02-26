<script setup>
import { ref, onMounted } from 'vue';
import Debug from '@/Debug.vue';
import useApiStore from '@/stores/api-store';
import Btn from '@/lockbox/elements/Btn.vue';

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
  const resp = await api.callApi(`lockbox/fxa/login`);
  if (resp.url) {
    authUrl.value = resp.url;

    const win = window.open(resp.url);
    const timer = setInterval(() => {
      if (win.closed) {
        clearInterval(timer);

        // show fresh login info
        pingSession();

        /*
TODO: follow same post-login flow:
- see if this is a first-time user
- if so, they need a keychain and a default folder
- then, you can do things like retrieve their folders
*/
      }
    }, 1000);
  }
}
</script>
<template>
  <Debug />
  <h1>Hi.</h1>
  <Btn @click.prevent="loginToMozAccount">Log into Moz Acct</Btn>
  <br />
  <!-- <a href="/lockbox/fxa/logout">Log out of FXA</a> -->
  <!-- <br /> -->
  <Btn @click.prevent="pingSession">ping session</Btn>
  <br />
  <br />
  <br />
  <pre v-if="resp">
    {{ JSON.stringify(resp, null, 4) }}
  </pre>
</template>
