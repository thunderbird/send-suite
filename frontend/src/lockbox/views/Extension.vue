<script setup>
import Debug from '@/Debug.vue';
import Wrapper from '@/Wrapper.vue';
import Core from '@/lockbox/Core.vue';
import Popup from './Popup.vue';
</script>

<template>
  <Wrapper>
    <Debug />
    <Core>
      <Popup />
    </Core>
  </Wrapper>
</template>
