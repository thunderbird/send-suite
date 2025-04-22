<script setup lang="ts">
import { trpc } from '@/lib/trpc';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useConfigStore } from '../send/stores/config-store';
import FeedbackBox from './FeedbackBox.vue';
import LoadingComponent from './LoadingComponent.vue';

const { isExtension } = useConfigStore();

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
const version = computed(() => {
  return data?.value?.apiVersion;
});

const reload = () => {
  window.location.reload();
};
const clientVersion = computed(() => data?.value?.clientVersion);
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
      You are using an outdated version of Thunderbird Send.

      <button
        class="refresh-button"
        data-testid="refresh-button"
        @click="reload"
      >
        Click here to refresh
      </button>
    </p>

    <p v-if="!isExtension">
      If you tried refreshing and the problem persists, please try clearing your
      cache.
    </p>

    <div v-if="isExtension">
      <p>You are using version {{ clientVersion }}</p>
      <p>Please update to version {{ version }} or higher</p>
      <p>
        If you have automatic updates enabled, we suggest you restart
        Thunderbird to make sure the update is applied.
        <br />
        If you don't have automatic updates enabled, please go to the
        Thunderbird Add-ons Manager and update the extension manually.
      </p>
    </div>

    <div>
      <p>If all else fails please raise an issue below</p>
      <FeedbackBox />
    </div>
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
