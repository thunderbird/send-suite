<script setup>
import { ref } from 'vue';
// import Wrapper from '@/Wrapper.vue';
const dirChoice = ref(null);

async function getDir() {
  // so far, can't actually choose a directory
  console.log(`hello`);
  // const dir = await browser.FileSystem.getDirectory('/');
  console.log('there');
  console.log(dir);
  debugger;
}
</script>

<template>
  <h1>Extension management page</h1>
  <form @submit.prevent>
    <label>
      <button @click.prevent="getDir">Choose directory</button>
    </label>
  </form>
</template>
