<script setup lang="ts">
import { ref } from 'vue';

import AcceptAccessLink from '@/apps/lockbox/views/AcceptAccessLink.vue';
import ViewShare from '@/apps/lockbox/views/ViewShare.vue';

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
