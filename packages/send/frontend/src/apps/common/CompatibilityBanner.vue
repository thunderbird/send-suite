<script lang="ts" setup>
import { trpc } from '@/lib/trpc';
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useConfigStore } from '../send/stores/config-store';
import CloseIcon from './CloseIcon.vue';

const { isProd } = useConfigStore();
const isClosedByUser = ref(false);

const { data, isLoading } = useQuery({
  queryKey: ['settingsQuery'],
  queryFn: async () => await trpc.settings.query({ version: __APP_VERSION__ }),
});

function close() {
  isClosedByUser.value = true;
}

const compatibility = computed(() => {
  if (data?.value?.compatibility.result === 'FORCE_UPDATE') {
    return 'FORCE_UPDATE';
  }
  if (data?.value?.compatibility.result === 'PROMPT_UPDATE') {
    return 'PROMPT_UPDATE';
  }
  if (data?.value?.compatibility.result === 'COMPATIBLE') {
    return 'COMPATIBLE';
  }
  return null;
});
</script>

<template>
  <header v-if="!isClosedByUser">
    <button class="closebutton" :onclick="close">
      <CloseIcon />
    </button>
    <!-- If the user is on a testing environment, that should be the only banner shown -->
    <p v-if="!isProd" class="testing text-center">
      You are using a testing version of Thunderbird Send. It may be unstable.
    </p>

    <div v-else>
      <div v-if="isLoading" data-testid="loading-compatibility"></div>
      <div v-else>
        <p v-if="compatibility === 'FORCE_UPDATE'" class="critical">
          You are using an outdated version of Thunderbird Send. Please update
          to make sure the application works correctly.
        </p>

        <p v-if="compatibility === 'PROMPT_UPDATE'" class="warning">
          There is a new version of Thunderbird Send available. Please update to
          the latest version.
        </p>
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
