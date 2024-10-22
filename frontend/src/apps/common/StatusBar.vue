<script setup lang="ts">
import useApiStore from '@/stores/api-store';
import { ref } from 'vue';
import { useStatusStore } from '../lockbox/stores/status-store';

const isAPIOn = ref('...');
const showDebugger = ref(false);
const data = ref('');
const { api } = useApiStore();
const { validators } = useStatusStore();

async function initialize() {
  showDebugger.value = true;

  async function healthCheck() {
    const healthcheck = await api.call('health');
    isAPIOn.value = JSON.stringify(healthcheck);

    const x = await validators();
    console.log(x);
    data.value = JSON.stringify(x);
  }

  healthCheck();

  setInterval(() => {
    healthCheck();
  }, 10_000);
}
</script>
<template>
  <div v-if="showDebugger" class="container">
    <div>
      <p>
        Is the backend up? <span>{{ !!isAPIOn }}</span>
      </p>
    </div>
    <p>This debugger checks api every 10s</p>
    <code>{{ data }}</code>
  </div>

  <button v-else @click="initialize">🐞</button>
</template>

<style>
.container {
  outline: rebeccapurple 1px solid;
  padding: 1rem;
}
</style>
