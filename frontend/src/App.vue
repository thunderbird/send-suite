<script setup>
import Debug from './views/Debug.vue';
import Wrapper from './Wrapper.vue';
</script>

<template>
  <Wrapper>
    <Debug />
    <router-view></router-view>
  </Wrapper>
</template>
