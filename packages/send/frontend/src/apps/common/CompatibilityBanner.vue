<script lang="ts" setup>
import { trpc } from '@/lib/trpc';
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useConfigStore } from '../send/stores/config-store';
import CloseButton from './CloseButton.vue';

const { isProd } = useConfigStore();
const isClosedByUser = ref(false);

const { data, isLoading } = useQuery({
  queryKey: ['settingsQuery'],
  queryFn: async () => await trpc.settings.query({ version: __APP_VERSION__ }),
  enabled: isProd,
});

function close() {
  isClosedByUser.value = true;
}

const compatibility = computed(() => {
  if (data?.value?.compatibility.result === 'PROMPT_UPDATE') {
    return 'PROMPT_UPDATE';
  }
  return null;
});
</script>

<template>
  <header v-if="!isClosedByUser" data-testid="compatibility-banner">
    <div v-if="!isProd" data-testid="testing-banner">
      <p class="testing text-center">
        You are using a testing version of Thunderbird Send. It may be unstable.
      </p>
      <CloseButton :close="close" />
    </div>

    <div v-else>
      <div v-if="isLoading" data-testid="loading-compatibility-banner"></div>
      <div v-else>
        <div
          v-if="compatibility === 'PROMPT_UPDATE'"
          data-testid="prompt-update-banner"
        >
          <p class="warning">
            There is a new version of Thunderbird Send available. Please update
            to the latest version.
          </p>
          <CloseButton :close="close" />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  position: relative;
}
p {
  font-weight: bold;
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
