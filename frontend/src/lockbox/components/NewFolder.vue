<script setup>
import { inject } from 'vue';

const api = inject('api');
const user = inject('user');
const keychain = inject('keychain');

async function createFolder() {
  console.log(`you want to create a folder`);
  const response = await api.createFolder(user.id, 'Untitled');
  console.log(response);
  // await keychain.createAndAddContainerKey(1);
  await keychain.newKeyForContainer(response.id);
  await keychain.store();
}
</script>
<template>
  <button class="btn-primary" @click.prevent="createFolder">New Folder</button>
</template>
