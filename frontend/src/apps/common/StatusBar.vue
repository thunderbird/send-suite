<script setup lang="ts">
import useApiStore from '@/stores/api-store';
import { ref } from 'vue';
import { useStatusStore } from '../lockbox/stores/status-store';

const isAPIOn = ref('...');
const showDebugger = ref(false);
const isOpen = ref(false);
const data = ref('');
const { api } = useApiStore();
const { validators } = useStatusStore();

function open() {
  isOpen.value = !isOpen.value;
}

async function initialize() {
  showDebugger.value = true;

  async function healthCheck() {
    const healthcheck = await api.call('health');
    isAPIOn.value = JSON.stringify(healthcheck);

    const validationResult = await validators();
    data.value = JSON.stringify(validationResult);
  }

  healthCheck();

  setInterval(() => {
    healthCheck();
  }, 10_000);
}
</script>
<template>
  <div class="toolbar">
    <div v-if="!isOpen" :ondblclick="open">🟩</div>
    <div v-if="isOpen">
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
      <button @dblclick="console.warn('Test error')">🐧</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  outline: rebeccapurple 1px solid;
  padding: 1rem;
}
.toolbar {
  position: absolute;
  bottom: 1rem;
  right: 2rem;
}
</style>
