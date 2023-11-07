<script setup>
import { ref, inject, watch } from 'vue';
const {
  deleteFolder,
  setCurrentFile,
  currentFolderId,
  setCurrentFolderId,
  folders,
  getFolders,
} = inject('folderManager');

const folder = ref(null);
/*
- show ManageSharing component
- reuse(?) shared-with component
  - or leave it TBD for now
- tags aren't implemented yet
- download link is TBD
*/


watch(currentFolderId, () => {
  folder.value = folders.value.find(f => {
    console.log(f.name)
    return f.id === currentFolderId.value
  });
  console.log(folder.value)
})
</script>

<template>
  <div
  v-if="currentFolderId"
  class="flex flex-col items-center w-full h-screen px-3">
    <div class="w-full flex flex-col items-center">
      <img class="w-4/5" src="/folder-icon.png" alt="Folder icon" />
      <h2 class="font-semibold pt-3">{{ folder.name }}</h2>
      <!-- <h3 class="pt-1">1.37 MB</h3> -->
    </div>
    <div class="w-full h-full mt-10">
      <div class="h-full flex flex-col justify-between">

        <!-- Top -->
        <div>
          <div class="mb-4">
            <div class="font-bold mb-1 text-gray-600">
              Share Link
            </div>
            <input
              class="rounded-sm w-full px-2 py-2"
              placeholder="https://pro.thunderbird.com/abc123"
            />
          </div>
          <div class="mb-4">
            <div class="font-bold mb-1 text-gray-600">
              Link Expires
            </div>
            <select class="w-full">
              <option>Never</option>
            </select>
          </div>
          <div class="mb-4">
            <div class="font-bold mb-1 text-gray-600">
              Password
            </div>
            <input
              class="rounded-sm w-full px-2 py-2"
              type="password"
              placeholder="Optional password"
            />
          </div>
          <div class="w-full">
            <div class="font-bold mb-1 text-gray-600">
              Shared With
            </div>
          </div>
          <!-- <div class="w-full">
            <div class="font-bold mb-1 text-gray-600">
              Tags
            </div>
          </div> -->
        </div>

        <!-- Bottom -->
        <div>
          <div class="mb-4">
            <div class="font-semibold text-gray-600">
              Created
            </div>
            <div>
              7/10/23, 12:00 PM
            </div>
          </div>
          <div class="mb-2">
            <div class="font-semibold text-gray-600">
              Modified
            </div>
            <div>
              7/10/23, 12:00 PM
            </div>
          </div>
          <div class="flex flex-row justify-end gap-3 mb-3">
            <a href="#" @click.prevent>DL</a>
            <a href="#" @click.prevent>Share</a>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>