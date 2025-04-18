<script setup lang="ts">
import { trpc } from '@/lib/trpc';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import LoadingComponent from './LoadingComponent.vue';

const { data, isLoading, error } = useQuery({
  queryKey: ['settingsQuery'],
  queryFn: async () => await trpc.settings.query({ version: __APP_VERSION__ }),
});

const compatibility = computed(() => {
  if (data?.value?.compatibility.result === 'FORCE_UPDATE') {
    return 'FORCE_UPDATE';
  }

  return null;
});
</script>

<template>
  <div v-if="isLoading">
    <LoadingComponent />
  </div>

  <div v-else-if="error" data-testid="error">Error: {{ error }}</div>

  <div
    v-else-if="compatibility === 'FORCE_UPDATE'"
    data-testid="force-update-banner"
  >
    <p class="critical">
      You are using an outdated version of Thunderbird Send. Please update to
      make sure the application works correctly.
    </p>
  </div>

  <slot v-else-if="compatibility === null"></slot>
</template>

<style scoped>
header {
  position: relative;
}
p {
  font-weight: bold;
}
.critical {
  background: var(--colour-ti-critical);
  padding: 1rem;
}
.warning {
  background: var(--colour-warning-default);
  padding: 1rem;
}
.testing {
  background: var(--colour-send-primary-accent-1);
  padding: 1rem;
}
.closebutton {
  position: absolute;
  right: 0;
  top: 0;
  padding: 0.5rem;
}
</style>
