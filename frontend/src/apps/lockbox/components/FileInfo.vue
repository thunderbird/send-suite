<script setup>
import { ref } from 'vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';

import FileNameForm from '@/apps/lockbox/elements/FileNameForm.vue';
import TagLabel from '@/apps/lockbox/elements/TagLabel.vue';
import Btn from '@/apps/lockbox/elements/Btn.vue';
import { formatBytes } from '@/lib/utils';
import { IconDownload, IconShare } from '@tabler/icons-vue';
import AddTag from '@/apps/lockbox/components/AddTag.vue';

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
        <FileNameForm v-if="showForm" @renameComplete="showForm = false" />
      </div>
      <div class="text-xs">{{ formatBytes(folderStore.selectedFile.upload.size) }}</div>
    </header>
    <!-- sharing config -->
    <!-- <CreateAccessLink :folderId="folderStore.selectedFile.id" /> -->
    <!-- tags -->
    <!-- <section class="flex flex-col gap-2">
      <div class="font-semibold text-gray-600">Tags</div>
      <div class="flex flex-wrap gap-1">
        <TagLabel v-for="tag in folderStore.selectedFile.tags" :color="tag.color"> {{ tag.name }}</TagLabel>
      </div>
      {{ folderStore.selectedFile.id }}
    </section> -->
    <!-- meta -->
    <footer class="mt-auto flex flex-col gap-3">
      <label class="flex flex-col gap-1" v-if="folderStore.selectedFile.createdAt">
        <span class="text-xs font-semibold text-gray-600">Created</span>
        <div class="text-xs">{{ folderStore.selectedFile.createdAt }}</div>
      </label>
      <label class="flex flex-col gap-1" v-if="folderStore.selectedFile.updatedAt">
        <span class="text-xs font-semibold text-gray-600">Modified</span>
        <div class="text-xs">{{ folderStore.selectedFile.updatedAt }}</div>
      </label>
      <div class="flex justify-end gap-2">
        <Btn
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
        <!-- <Btn primary><IconShare class="w-4 h-4" /> Share</Btn> -->
      </div>
    </footer>
  </div>
</template>
