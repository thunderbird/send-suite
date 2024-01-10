<script setup>
import { inject, onMounted } from 'vue';

import useFolderStore from '@/lockbox/stores/folder-store';

import { IconDownload, IconShare, IconTrash, IconDotsVertical } from '@tabler/icons-vue';
import FolderTableRowCell from '@/lockbox/elements/FolderTableRowCell.vue';
import Btn from '@/lockbox/elements/Btn.vue';
import DragAndDropUpload from '@/lockbox/components/DragAndDropUpload.vue';
import Breadcrumbs from '@/lockbox/components/Breadcrumbs.vue';
import Tag from '@/lockbox/elements/Tag.vue';

const folderStore = useFolderStore();

// const { toggleItemForSharing } = inject('sharingManager');

const dayjs = inject('dayjs');

// onMounted(getVisibleFolders);
// onMounted(folderStore.fetchUserFolders);

function showFileInfo(file) {
  // console.log(`user chose to show info for file ${file.id}`);
  // setCurrentFile(file);
}
</script>
<template>
  <div class="w-full flex flex-col gap-3">
    <h2 class="font-bold">Your Files</h2>
    <Breadcrumbs />
    <!-- <DragAndDropUpload> -->
    <table class="w-full border-separate border-spacing-x-0 border-spacing-y-1">
      <thead>
        <tr>
          <th class="border-r border-b border-gray-300"></th>
          <th class="border-r border-b border-gray-300">Name</th>
          <th class="border-r border-b border-gray-300">Tags</th>
          <th class="border-r border-b border-gray-300">Shared With</th>
          <th class="border-b border-gray-300">Access</th>
        </tr>
      </thead>
      <tbody>
        <tr
          class="group cursor-pointer"
          v-for="folder in folderStore.visibleFolders"
          :key="folder.id"
          @click="folderStore.setSelectedFolder(folder.id)"
          @dblclick="folderStore.goToRootFolder(folder.id)"
        >
          <FolderTableRowCell :selected="folder.id === folderStore.selectedFolder?.id">
            <img src="@/assets/folder.svg" class="w-8 h-8" />
          </FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === folderStore.selectedFolder?.id">
            <div>{{ folder.name }}</div>
            <div class="text-sm">Last modified {{ dayjs().to(dayjs(folder.updatedAt)) }}</div>
          </FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === folderStore.selectedFolder?.id">
            <div class="flex">
              <Tag v-for="tag in folder.tags" :color="tag.color" />
            </div>
          </FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === folderStore.selectedFolder?.id"></FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === folderStore.selectedFolder?.id">
            <div class="flex justify-between">
              <div
                class="flex gap-2 opacity-0 group-hover:!opacity-100 transition-opacity"
                :class="{ '!opacity-100': folder.id === folderStore.selectedFolder?.id }"
              >
                <Btn secondary>
                  <IconDownload class="w-4 h-4" />
                </Btn>
                <Btn primary> <IconShare class="w-4 h-4" /> Share </Btn>
                <Btn danger @click="deleteFolder(folder.id)">
                  <IconTrash class="w-4 h-4" />
                </Btn>
              </div>
              <Btn class="ml-auto">
                <IconDotsVertical class="w-4 h-4" />
              </Btn>
            </div>
          </FolderTableRowCell>
        </tr>

        <!-- v-if="folder.id === folderStore.selectedFolder?.id" -->
        <tr
          class="group cursor-pointer"
          v-if="folderStore.rootFolder"
          v-for="item in folderStore.rootFolder.items"
          :key="item.id"
          @click="showFileInfo(item)"
        >
          <FolderTableRowCell>
            <div class="flex justify-end">
              <img src="@/assets/file.svg" class="w-8 h-8" />
            </div>
          </FolderTableRowCell>
          <FolderTableRowCell>
            <div>{{ item.name }}</div>
            <div class="text-sm">Last modified {{ dayjs().to(dayjs(item.updatedAt)) }}</div>
          </FolderTableRowCell>
          <FolderTableRowCell></FolderTableRowCell>
          <FolderTableRowCell></FolderTableRowCell>
          <FolderTableRowCell>
            <div class="flex justify-between">
              <div class="flex gap-2 opacity-0 group-hover:!opacity-100 transition-opacity">
                <Btn secondary>
                  <IconDownload class="w-4 h-4" />
                </Btn>
                <Btn primary> <IconShare class="w-4 h-4" /> Share </Btn>
                <Btn danger @click="deleteItemAndContent(item.id)">
                  <IconTrash class="w-4 h-4" />
                </Btn>
              </div>
              <Btn class="ml-auto">
                <IconDotsVertical class="w-4 h-4" />
              </Btn>
            </div>
          </FolderTableRowCell>
        </tr>
      </tbody>
    </table>
    <!-- </DragAndDropUpload> -->
  </div>
</template>
