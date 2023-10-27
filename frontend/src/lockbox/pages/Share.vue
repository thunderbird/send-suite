<script setup>
import { ref } from 'vue';

import Core from '@/lockbox/Core.vue';
import AcceptAccessLink from '../views/AcceptAccessLink.vue';
import ViewShare from '../views/ViewShare.vue';

const isViewShareReady = ref(false);

function acceptAccessLinkComplete() {
  isViewShareReady.value = true;
}
</script>

<template>
  <Core>
    <template v-if="isViewShareReady">
      <ViewShare />
    </template>
    <template v-else>
      <AcceptAccessLink @acceptAccessLinkComplete="acceptAccessLinkComplete" />
    </template>
  </Core>
</template>
