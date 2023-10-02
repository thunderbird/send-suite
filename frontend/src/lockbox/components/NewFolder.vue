<script setup>
import { inject } from 'vue';

const emit = defineEmits(['createComplete']);
const api = inject('api');
const user = inject('user');
const keychain = inject('keychain');

async function createFolder() {
  console.log(`you want to create a folder`);
  const response = await api.createFolder(user.value.id, 'Untitled');
  console.log(response);
  // await keychain.createAndAddContainerKey(1);
  await keychain.value.newKeyForContainer(response.id);
  await keychain.value.store();
  console.log(`finished creating folder`);
  emit('createComplete');
}
</script>
<template>
  <button class="btn-primary" @click.prevent="createFolder">New Folder</button>
</template>
