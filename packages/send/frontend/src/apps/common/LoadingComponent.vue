<script setup lang="ts">
import SpinnerAnimated from '../send/components/SpinnerAnimated.vue';
</script>

<template>
  <div class="loading" data-tesid="loading">
    <SpinnerAnimated />
  </div>
</template>

<style scoped>
.loading {
  min-height: 80px;
  display: flex;
  align-content: flex-start;
}
</style>
