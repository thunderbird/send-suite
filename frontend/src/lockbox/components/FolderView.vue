<script setup>
import { inject, onMounted } from 'vue';
import { IconDownload, IconShare, IconTrash, IconDotsVertical } from '@tabler/icons-vue';
import FolderTableRowCell from '@/lockbox/elements/FolderTableRowCell.vue';
import Btn from '@/lockbox/elements/Btn.vue';
import DragAndDropUpload from './DragAndDropUpload.vue';
// import Btn from '@/lockbox/elements/Btn.vue';

const {
  deleteFolder,
  setCurrentFile,
  rootFolder,
  currentFolderId,
  setCurrentFolderId,
  folders,
  getVisibleFolders,
  gotoRootFolder,
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
    <h2 class="font-bold">Your Files</h2>
    <DragAndDropUpload>
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
            v-for="folder in folders"
            :key="folder.id"
            @click="setCurrentFolderId(folder.id)"
            @dblclick="gotoRootFolder(folder.id)"
          >
            <FolderTableRowCell :selected="folder.id === currentFolderId">
              <img src="@/assets/folder.svg" class="w-8 h-8" />
            </FolderTableRowCell>
            <FolderTableRowCell :selected="folder.id === currentFolderId">
              <div>{{ folder.name }}</div>
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

          <!-- v-if="folder.id === currentFolderId" -->
          <tr class="group cursor-pointer" v-if="rootFolder" v-for="item in rootFolder.items" :key="item.id">
            <FolderTableRowCell>
              <div class="flex justify-end">
                <img src="@/assets/file.svg" class="w-8 h-8" />
              </div>
            </FolderTableRowCell>
            <FolderTableRowCell>
              <div>{{ item.name }}</div>
              <div class="text-sm">Last modified</div>
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
                  <Btn danger>
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
    </DragAndDropUpload>
  </div>
</template>
