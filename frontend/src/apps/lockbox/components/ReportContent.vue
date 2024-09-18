<script setup lang="ts">
import useApiStore from '@/stores/api-store';
import useMetricsStore from '@/stores/metrics';
import { ref } from 'vue';
import { FolderResponse } from '../stores/folder-store.types';

type ReportProps = {
  uploadId: string;
  containerId: FolderResponse['id'];
};

const { api } = useApiStore();
const { metrics } = useMetricsStore();

const hasClicked = ref(false);
const hasReported = ref(false);

async function reportContent({ uploadId, containerId }: ReportProps) {
  console.log('reporting content', { uploadId, containerId });
  await api.call(`containers/${containerId}/report`, { uploadId }, 'POST');
  metrics.capture('report_content_confirm', { uploadId, containerId });

  hasReported.value = true;
  setTimeout(() => {
    location.reload();
  }, 2000);
}

function handleClickReport({ uploadId, containerId }: ReportProps) {
  metrics.capture('report_content_attempt', { uploadId, containerId });
  hasClicked.value = true;
}

defineProps<ReportProps>();
</script>

<template>
  <div v-if="hasReported">
    <p>Thank you for your report!</p>
  </div>
  <div v-else>
    <div v-if="!hasClicked" class="report">
      <p>
        Is this content harmful?
        <span
          class="clickable"
          @click.prevent="handleClickReport({ uploadId, containerId })"
        >
          Report it</span
        >
      </p>
    </div>
    <div v-else class="report">
      <p>
        Please confirm your report
        <span
          class="clickable"
          @click.prevent="reportContent({ uploadId, containerId })"
          >here</span
        >
      </p>
    </div>
  </div>
</template>

<style scoped>
.report {
  display: flex;
}
.clickable {
  cursor: pointer;
  color: blue;
}
</style>
