<script lang="ts" setup>
import { useConfigStore } from '../send/stores/config-store';

const { isProd } = useConfigStore();
</script>

<template>
  <!-- We invert the icon on non production environments -->
  <img
    src="./banner.svg"
    alt="Thunderbird send icon"
    :class="{ inverted: !isProd }"
  />
</template>

<style scoped>
.inverted {
  filter: invert(1);
}
</style>
