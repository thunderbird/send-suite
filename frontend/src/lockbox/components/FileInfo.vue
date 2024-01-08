<script setup>
import { ref, inject, watchEffect } from 'vue';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';

// import CreateShare from './CreateShare.vue';
import Downloader from '@/common/download';
import FileNameForm from '@/lockbox/elements/FileNameForm.vue';
import TagLabel from '@/lockbox/elements/TagLabel.vue';
import Btn from '@/lockbox/elements/Btn.vue';
import { formatBytes } from '@/lib/utils';
import { IconDownload, IconShare } from '@tabler/icons-vue';
import AddTag from '@/lockbox/components/AddTag.vue';

const { currentFile, deleteItemAndContent } = inject('folderManager');

const { api } = useApiStore();
const { keychain } = useKeychainStore();
const downloader = new Downloader(keychain, api);

async function downloadContent() {
  console.log(`Starting download`);
  const { uploadId, containerId, wrappedKey, name } = currentFile.value;
  const success = await downloader.doDownload(uploadId, containerId, wrappedKey, name);
}

const showForm = ref(false);

/*
Note about shareOnly containers.
- if this file is in a shareOnly Container, show the sharing controls here (because the Container was only created for the purpose of sharing this Item)
- TODO: decide what to do if there were multiple Items shared via the same shareOnly Container.
*/
</script>

<template>
  <div v-if="currentFile" class="flex flex-col gap-6 h-full">
    <!-- info -->
    <header class="flex flex-col items-center gap-3 pt-6">
      <img src="@/assets/file.svg" class="w-20 h-20" />
      <div class="font-semibold pt-4">
        <span v-if="!showForm" class="cursor- pointer" @click="showForm = true">
          {{ currentFile.name }}
        </span>
        <FileNameForm v-if="showForm" @renameComplete="showForm = false" />
      </div>
      <div class="text-xs">{{ formatBytes(currentFile.upload.size) }}</div>
    </header>
    <!-- sharing config -->
    <!-- <CreateAccessLink :folderId="currentFile.id" /> -->
    <!-- tags -->
    <!-- <section class="flex flex-col gap-2">
      <div class="font-semibold text-gray-600">Tags</div>
      <div class="flex flex-wrap gap-1">
        <TagLabel v-for="tag in currentFile.tags" :color="tag.color"> {{ tag.name }}</TagLabel>
      </div>
      {{ currentFile.id }}
    </section> -->
    <!-- meta -->
    <footer class="mt-auto flex flex-col gap-3">
      <label class="flex flex-col gap-1" v-if="currentFile.createdAt">
        <span class="text-xs font-semibold text-gray-600">Created</span>
        <div class="text-xs">{{ currentFile.createdAt }}</div>
      </label>
      <label class="flex flex-col gap-1" v-if="currentFile.updatedAt">
        <span class="text-xs font-semibold text-gray-600">Modified</span>
        <div class="text-xs">{{ currentFile.updatedAt }}</div>
      </label>
      <div class="flex justify-end gap-2">
        <Btn><IconDownload class="w-4 h-4" @click="downloadContent" /></Btn>
        <Btn primary><IconShare class="w-4 h-4" /> Share</Btn>
      </div>
    </footer>
  </div>
</template>
