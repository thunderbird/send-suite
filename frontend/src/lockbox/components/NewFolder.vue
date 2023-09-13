<script setup>
import { inject } from 'vue';

const api = inject('api');
const { user } = inject('user');
const keychain = inject('keychain');

async function createFolder() {
  console.log(`you want to create a folder`);
  const response = await api.createFolder(user.value.id, 'Untitled');
  console.log(response);
  // await keychain.createAndAddContainerKey(1);
  await keychain.newKeyForContainer(response.id);
}
</script>
<template>
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click.prevent="createFolder"
  >
    New Folder
  </button>
</template>
