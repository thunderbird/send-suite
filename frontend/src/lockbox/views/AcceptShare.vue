<script setup>
import { ref, inject, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();

const user = inject('user');
console.log(user.value.email);
// watchEffect(() => {
// 	console.log(user.value.email)
// 	console.log(`accept share sees updated user`)
// 	console.log(`I could replace my ._addOnLoad with watchEffect`)
// })
watch(
  () => user.value.id,
  () => {
    console.log(user.value.id);
    console.log(`we have a logged-in user`);
  }
);

/*
ok, what's my goal here?
I need to:
- if there's a user logged in,
- read the hash
- let them put in a password
- get and respond to the challenge
- get the container key
*/
</script>

<template>
  <h1>This This is where the cookies go</h1>
  <template v-if="user.email">
    <p>
      Hello,
      {{ user.email }}
    </p>
  </template>
  <p>
    {{ route.params.hash }}
  </p>
</template>
