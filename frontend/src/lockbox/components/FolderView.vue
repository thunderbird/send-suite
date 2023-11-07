<script setup>
import { inject, onMounted } from 'vue';
import FileUpload from '@/lockbox/components/FileUpload.vue';
import DragAndDropUpload from '@/lockbox/components/DragAndDropUpload.vue';
import ManageSharing from '@/lockbox/components/ManageSharing.vue';
import FolderTableRowCell from '@/lockbox/elements/FolderTableRowCell.vue';
// import Btn from '@/lockbox/elements/Btn.vue';

const {
  deleteFolder,
  setCurrentFile,
  currentFolderId,
  setCurrentFolderId,
  folders,
  getFolders,
} = inject('folderManager');

const { toggleItemForSharing } = inject('sharingManager');

onMounted(getFolders);

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
          <th class="border-r border-b border-gray-300 w-24"></th>
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
            <div class="text-sm">Last modified TODO</div>
          </FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === currentFolderId"></FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === currentFolderId"></FolderTableRowCell>
          <FolderTableRowCell :selected="folder.id === currentFolderId">
            <button v-if="folder.id === currentFolderId" @click="deleteFolder(folder.id)">
              Delete folder
            </button>
            <!-- <template v-if="folder.id === currentFolderId">
              <ManageSharing :folderId="currentFolderId" />
              <FileUpload />
              <DragAndDropUpload />
              <ul class="file-list">
                <li v-for="file of folder.items">
                  <button @click="showFileInfo(file.id, file.uploadId, folder.id, file.wrappedKey, file.name, file.type)">
                    {{ file.name }}
                  </button>
                  <button @click="toggleItemForSharing(file.id)">
                    [Share]
                  </button>
                </li>
              </ul>
            </template> -->
          </FolderTableRowCell>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="postcss">
.lockbox-folder {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}

.active {
  font-weight: bold;
}

.file-list {
  margin-left: 2rem;
}

.file-list li {
  list-style-type: disc;
}
</style>
