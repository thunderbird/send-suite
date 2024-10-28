<script setup lang="ts">
import { useStatusStore } from '../stores/status-store';

const { progress } = useStatusStore();

type Props = {
  type: string;
};
defineProps<Props>();
</script>
<template>
  <div>
    <p>{{ type }}</p>
  </div>
  <div>
    <div class="progress-bar-container">
      <div
        class="progress-bar"
        :style="{ width: progress.percentage + '%' }"
      ></div>
    </div>
    <span>{{ progress.percentage }} %</span>
  </div>
</template>

<style scoped>
.progress-bar-container {
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease;
}
</style>
