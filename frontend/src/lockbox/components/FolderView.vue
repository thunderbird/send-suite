<script setup>
import { inject, onMounted } from 'vue';
import { IconDownload, IconShare, IconTrash, IconDotsVertical } from '@tabler/icons-vue';
import FolderTableRowCell from '@/lockbox/elements/FolderTableRowCell.vue';
import Btn from '@/lockbox/elements/Btn.vue';
import FileUpload from '@/lockbox/components/FileUpload.vue';
import BreadCrumbs from '@/lockbox/components/Breadcrumbs.vue';
import ManageSharing from '@/lockbox/components/ManageSharing.vue';
// import Btn from '@/lockbox/elements/Btn.vue';

const {
  deleteFolder,
  setCurrentFile,
  currentFolderId,
  setCurrentFolderId,
  folders,
  getVisibleFolders,
} = inject('folderManager');

const { toggleItemForSharing } = inject('sharingManager');

onMounted(getVisibleFolders);

function showFileInfo(itemId, uploadId, folderId, wrappedKey, filename, type) {
  console.log(`user chose to show info for file ${itemId}`);
  setCurrentFile({ itemId, uploadId, folderId, wrappedKey, filename, type });
}
</script>
<template>
  <div class="w-full flex flex-col gap-3">
    <h2 class="font-bold">
      Your Files
      <button @click="loadFolderList">🔁</button>
    </h2>
    <table class="border-separate border-spacing-x-0 border-spacing-y-1">
      <thead>
        <tr>
          <th class="border-r border-b border-gray-300 w-24"><input type="checkbox" /></th>
          <th class="border-r border-b border-gray-300">Name</th>
          <th class="border-r border-b border-gray-300">Tags</th>
          <th class="border-r border-b border-gray-300">Shared With</th>
          <th class="border-b border-gray-300">Access</th>
        </tr>
      </thead>
      <tbody>
        <tr class="group" v-for="folder in folders" :key="folder.id" @click="setCurrentFolderId(folder.id)">
          <FolderTableRowCell :selected="folder.id === currentFolderId">
            <div class="flex items-center gap-4">
              <input type="checkbox" :checked="folder.id === currentFolderId">
              <img src="@/assets/folder.svg" class="w-8 h-8" />
            </div>
          </FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === currentFolderId">
            <div>{{ folder.name }} (ID {{ folder.id }})</div>
            <div class="text-sm">Last modified</div>
          </FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === currentFolderId"></FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === currentFolderId"></FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === currentFolderId">
            <div class="flex justify-between">
              <div
                class="flex gap-2 opacity-0 group-hover:!opacity-100 transition-opacity"
                :class="{ '!opacity-100': folder.id === currentFolderId }"
              >
                <Btn secondary>
                  <IconDownload class="w-4 h-4" />
                </Btn>
                <Btn primary>
                  <IconShare class="w-4 h-4" /> Share
                </Btn>
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
      </tbody>
    </table>
  </div>
</template>
