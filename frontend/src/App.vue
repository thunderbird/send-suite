<script setup>
import Conversations from './views/Conversations.vue';
import Debug from './views/Debug.vue';
import Wrapper from './Wrapper.vue';
</script>

<template>
  <Wrapper>
    <h1 className="text-3xl font-bold underline">Hello world!</h1>
    <div>
      <Debug />
    </div>
    <div class="main">
      <div class="column">
        <Conversations />
      </div>
      <div class="column"></div>
      <div class="column"></div>
    </div>
  </Wrapper>
</template>

<style scoped>
.main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
}
</style>
