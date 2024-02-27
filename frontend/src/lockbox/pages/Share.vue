<script setup>
import { ref } from 'vue';

import AcceptAccessLink from '../views/AcceptAccessLink.vue';
import ViewShare from '../views/ViewShare.vue';

const isViewShareReady = ref(false);

function acceptAccessLinkComplete() {
  isViewShareReady.value = true;
}
</script>

<template>
  <template v-if="isViewShareReady">
    <ViewShare />
  </template>
  <template v-else>
    <AcceptAccessLink @acceptAccessLinkComplete="acceptAccessLinkComplete" />
  </template>
</template>
