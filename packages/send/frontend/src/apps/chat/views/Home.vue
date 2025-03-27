<script setup>
import Conversations from './Conversations.vue';
</script>

<template>
  <h1 className="text-3xl font-bold">Pro Chat Demo</h1>
  <div class="main w-full">
    <Conversations />
  </div>
</template>

<style scoped>
.main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
}
</style>
