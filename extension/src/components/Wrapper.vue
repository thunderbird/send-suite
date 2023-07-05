<script setup>
import { ref, onMounted, provide } from "vue";
import { ApiConnection } from "../lib/api";
import { loadUser, loadServerUrl } from "../lib/sync";

const isInitComplete = ref(false);

const user = ref(null);
function updateUser(_user) {
  if (_user) {
    console.log(`Updating user`);
    user.value = _user;
  }
}
provide("user", {
  user,
  updateUser,
});

const api = ref(null);

function updateApiUrl(_url) {
  if (_url) {
    console.log(`Updating url`);
    api.value = new ApiConnection(_url);
  }
}

provide("api", {
  api,
  updateApiUrl,
});

onMounted(() => {
  console.log("Wrapper is mounted");
  console.log("Checking storage for user.");
  const _user = loadUser();
  if (_user) {
    console.log(`got a user:`, _user);
    user.value = _user;
  }
  console.log("Checking storage for serverUrl.");
  const _url = loadServerUrl();
  if (_url) {
    console.log(`got a url:`, _url);
    api.value = new ApiConnection(_url);
  } else {
    console.log(`Need to add a server url`);
    alert(`Need to add a server url in the management page`);
  }
  isInitComplete.value = true;
});
</script>

<template>
  <slot v-if="isInitComplete"></slot>
</template>
