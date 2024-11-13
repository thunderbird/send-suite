<script setup lang="ts">
import useFolderStore from '@/apps/lockbox/stores/folder-store';
import { ref } from 'vue';

import Btn from '@/apps/lockbox/elements/BtnComponent.vue';
import FileNameForm from '@/apps/lockbox/elements/FileNameForm.vue';
import { formatBytes } from '@/lib/utils';
import { IconDownload } from '@tabler/icons-vue';

const folderStore = useFolderStore();

const showForm = ref(false);

/*
Note about shareOnly containers.
- if this file is in a shareOnly Container, show the sharing controls here (because the Container was only created for the purpose of sharing this Item)
- TODO: decide what to do if there were multiple Items shared via the same shareOnly Container.
*/
</script>

<template>
  <div v-if="folderStore.selectedFile" class="flex flex-col gap-6 h-full">
    <!-- info -->
    <header class="flex flex-col items-center">
      <img src="@/apps/lockbox/assets/file.svg" class="w-20 h-20" />
      <div class="font-semibold pt-4">
        <span v-if="!showForm" class="cursor- pointer" @click="showForm = true">
          {{ folderStore.selectedFile.name }}
        </span>
        <FileNameForm v-if="showForm" @rename-complete="showForm = false" />
      </div>
      <div class="text-xs">
        {{ formatBytes(folderStore.selectedFile.upload.size) }}
      </div>
    </header>
    <footer class="mt-auto flex flex-col gap-3">
      <label
        v-if="folderStore.selectedFile.createdAt"
        class="flex flex-col gap-1"
      >
        <span class="text-xs font-semibold text-gray-600">Created</span>
        <div class="text-xs">{{ folderStore.selectedFile.createdAt }}</div>
      </label>
      <label
        v-if="folderStore.selectedFile.updatedAt"
        class="flex flex-col gap-1"
      >
        <span class="text-xs font-semibold text-gray-600">Modified</span>
        <div class="text-xs">{{ folderStore.selectedFile.updatedAt }}</div>
      </label>
      <label
        v-if="folderStore.selectedFile.upload.expired"
        class="flex flex-col gap-1"
      >
        <span class="text-xs font-semibold text-red-600">Expired</span>
      </label>
      <div class="flex justify-end gap-2">
        <Btn v-if="!folderStore.selectedFile.upload.expired"
          ><IconDownload
            class="w-4 h-4"
            @click="
              folderStore.downloadContent(
                folderStore.selectedFile.uploadId,
                folderStore.selectedFile.containerId,
                folderStore.selectedFile.wrappedKey,
                folderStore.selectedFile.name
              )
            "
        /></Btn>
      </div>
    </footer>
  </div>
</template>
