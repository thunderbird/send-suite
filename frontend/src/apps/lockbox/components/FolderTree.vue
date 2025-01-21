<script setup lang="ts">
import DownloadModal from '@/apps/common/modals/DownloadModal.vue';
import ReportContent from '@/apps/lockbox/components/ReportContent.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { ref } from 'vue';
import { useModal, useModalSlot } from 'vue-final-modal';
import { FolderResponse } from '../stores/folder-store.types';
import DownloadConfirmation from './DownloadConfirmation.vue';
const folderStore = useFolderStore();

type ReportProps = {
  folder: FolderResponse;
  containerId: FolderResponse['id'];
};

const isDownloading = ref<Props[]>([]);
const isError = ref(false);

type Props = {
  uploadId: string;
  containerId: number;
  wrappedKey: string;
  name: string;
};

const onDownloadConfirm = async () => {
  await downloadConfirmed();
};

const { open, close: closefn } = useModal({
  component: DownloadModal,
  attrs: {
    title: 'Download File?',
  },
  slots: {
    default: useModalSlot({
      component: DownloadConfirmation,
      attrs: {
        closefn: () => {
          isDownloading.value.pop();
          return closefn();
        },
        confirm: onDownloadConfirm,
        text: `Please note that you are downloading a file shared via Send. Send does not scan files for viruses, malware, or other harmful content. We recommend that you only download files from trusted sources and use your own virus protection software. Send is not responsible for any issues that may arise from this download.`,
      },
    }),
  },
});

async function setDownload({ uploadId, containerId, wrappedKey, name }: Props) {
  isDownloading.value.push({
    uploadId,
    containerId,
    wrappedKey,
    name,
  });
}

async function downloadConfirmed() {
  const item = isDownloading.value.pop();
  try {
    await folderStore.downloadContent(
      item.uploadId,
      item.containerId,
      item.wrappedKey,
      item.name
    );
  } catch (error) {
    isError.value = error;
    console.error(error);
  }
}

defineProps<ReportProps>();
</script>
<template>
  <ul v-if="folder">
    <div v-if="!folder?.items?.length">
      <p>This folder is empty or the files uploaded to it have expired</p>
    </div>
    <li
      v-for="{
        uploadId,
        name,
        wrappedKey,
        upload: { daysToExpiry, expired, size, type },
      } of folder.items"
      :key="uploadId"
    >
      <div class="flex justify-between">
        <div>
          id: {{ uploadId }}<br />
          file name: {{ name }}<br />
          size: {{ size }} bytes<br />
          mime type: {{ type }}<br />
          <div>
            <span v-if="expired" class="text-red-500">Expired</span>
            <span v-else>expires in: {{ daysToExpiry }} days</span>
          </div>
        </div>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none: disabled:bg-gray-400"
          @click.prevent="
            () => {
              open();
              setDownload({
                uploadId,
                containerId,
                wrappedKey,
                name,
              });
            }
          "
        >
          <span class="font-bold">Download</span>
        </button>
      </div>
      <div v-if="!expired">
        <ReportContent :upload-id="uploadId" :container-id="containerId" />
      </div>
    </li>
  </ul>
</template>

<style scoped>
li {
  outline: 1px solid grey;
  margin: 1em auto;
  padding: 0.5rem;
}
</style>
