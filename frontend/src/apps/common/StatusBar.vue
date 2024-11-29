<!--
  StatusBar component - A debug toolbar that appears at the bottom right of the screen.
  It displays API health status and validation results when activated. The component
  includes a toggle button and performs periodic health checks every 10 seconds.
-->
<script setup lang="ts">
import useApiStore from '@/stores/api-store';
import { onMounted, ref } from 'vue';
import { useStatusStore } from '../lockbox/stores/status-store';
const { api } = useApiStore();
const { validators } = useStatusStore();

const APIstatus = ref('...');
const showDebugger = ref(false);
const isToolbarOpen = ref(false);
const validationData = ref('');
const isOffline = ref(false);

const statusIndicator = ref('⬜️');

function open() {
  isToolbarOpen.value = !isToolbarOpen.value;
}

onMounted(() => {
  healthCheck();
});

async function healthCheck() {
  const healthcheck = await api.call('health');
  APIstatus.value = healthcheck ? '✅' : '❌';
  statusIndicator.value = !!healthcheck ? '🟩' : '🟥';
  if (!healthcheck) {
    isOffline.value = true;
  }

  const validationResult = await validators();
  validationData.value = JSON.stringify(validationResult);
}
async function initialize() {
  showDebugger.value = true;
  healthCheck();
  setInterval(() => {
    healthCheck();
  }, 10_000);
}
</script>
<template>
  <!-- If the API isn't responding to healthchecks show red banner -->
  <header v-if="isOffline" class="top-status-bar">
    <p>
      Our API isn't responding, please try again later. If the problem persists
      please file a bug below
    </p>
  </header>

  <!-- This is for debugging purposes only -->
  <div class="toolbar">
    <div v-if="!isToolbarOpen" title="debugging options" :ondblclick="open">
      {{ statusIndicator }}
    </div>
    <div v-if="isToolbarOpen">
      <div v-if="showDebugger" class="container">
        <div>
          <p>
            API is on? <span>{{ APIstatus }}</span>
          </p>
        </div>
        <p>This debugger checks api every 10s</p>
        <code>{{ validationData }}</code>
      </div>

      <button v-else title="open inline debugging" @click="initialize">
        🐞
      </button>
      <button
        title="double click to trigger a console.warn"
        @dblclick="console.warn('Test error')"
      >
        🐧
      </button>
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
.top-status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #ff0000;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
}
</style>
