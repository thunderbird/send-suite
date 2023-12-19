<script setup>
import Debug from '@/Debug.vue';
import Wrapper from '@/Wrapper.vue';
import Core from './Core.vue';
import Popup from './views/Popup.vue';

// Includes Wrapper and Debug since we're not being rendered by the router
</script>

<template>
  <Wrapper>
    <Core>
      <Debug />
      <Popup />
    </Core>
  </Wrapper>
</template>
