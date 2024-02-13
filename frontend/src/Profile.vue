<script setup>
import { ref, onMounted } from 'vue';
import Debug from '@/Debug.vue';
import useApiStore from '@/stores/api-store';
const { api } = useApiStore();

const sessionId = ref(api.sessionId);
const resp = ref(null);

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('sessionId');
  if (id) {
    sessionId.value = id;
    api.setSessionId(sessionId.value);
  }
});

async function pingSession() {
  resp.value = await api.callApi(`debug-session`, {}, 'GET');
  console.log(`session from backend:`);
  console.log(resp.value);
}
</script>
<template>
  <Debug />
  <h1>Hi.</h1>
  <p v-if="sessionId">You have a session id: {{ sessionId }}</p>
  <br />
  <a href="/lockbox/fxa/login">Log into FXA</a>
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
