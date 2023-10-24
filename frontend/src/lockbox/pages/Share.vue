<script setup>
import { ref } from 'vue';

import Core from '@/lockbox/Core.vue';
import AcceptShare from '../views/AcceptShare.vue';
import ViewShare from '../views/ViewShare.vue';

const isViewShareReady = ref(false);

function acceptShareComplete() {
  isViewShareReady.value = true;
}
</script>

<template>
  <Core>
    <template v-if="isViewShareReady">
      <ViewShare />
    </template>
    <template v-else>
      <AcceptShare @acceptShareComplete="acceptShareComplete" />
    </template>
  </Core>
</template>
