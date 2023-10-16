<script setup>
import { inject } from 'vue';
import FileUpload from './FileUpload.vue';

const {
  deleteFolder,
  setCurrentFile,
  currentFolderId,
  setCurrentFolderId,
  folders,
} = inject('folderManager');

const emit = defineEmits(['toggleSelection']);

function showFileInfo(itemId, uploadId, folderId, wrappedKey, filename, type) {
  console.log(`user chose to show info for file ${itemId}`);
  setCurrentFile({
    itemId,
    uploadId,
    folderId,
    wrappedKey,
    filename,
    type,
  });
}

function selectFile(fileId) {
  emit('toggleSelection', fileId);
  // TODO: craete an inject()-able that handles all the try/catch
  // try {
  // console.log(`this should only be available in the extension`);

  //   // first version: send a message, indicating that this single
  //   // should be shared.
  //   browser.runtime.sendMessage({
  //     type: FILE_SELECTED,
  //     fileId,
  //   });

  // } catch (e) {
  //   console.log(`We must not be in the extension`);
  // }
}
</script>
<template>
  <h2>Folders</h2>
  <button class="btn-primary" @click="loadFolderList">🔃</button>
  <ul>
    <li v-for="folder of folders">
      <div
        class="lockbox-folder"
        :class="{ active: folder.id === currentFolderId }"
      >
        <a href="#" @click.prevent="setCurrentFolderId(folder.id)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
            <g
              transform="matrix(.04235 0 0 .04193 12.359-25.862)"
              fill="#60aae5"
              stroke="#4f96d1"
            >
              <g fill="#70cbe2">
                <path
                  transform="matrix(.7872 0 0 .79524 415.34 430.11)"
                  d="m-884.1 294.78c-4.626 0-8.349 3.718-8.349 8.335v119.41l468.19 1v-79.2c0-4.618-3.724-8.335-8.35-8.335h-272.65c-8.51.751-9.607-.377-13.812-5.981-5.964-7.968-14.969-21.443-20.84-29.21-4.712-6.805-5.477-6.02-13.292-6.02z"
                  stroke="none"
                  color="#000"
                />
                <path
                  d="m.588 4.07c-.178 0-.32.142-.32.32v9.199c0 .178.142.32.32.32h14.824c.178 0 .32-.142.32-.32v-9.199c0-.178-.142-.32-.32-.32z"
                  transform="matrix(23.61017 0 0 23.85134-291.8 616.81)"
                  stroke="#70cbe2"
                  stroke-width=".079"
                />
              </g>
              <rect
                transform="matrix(.7872 0 0 .79524 415.34 430.11)"
                y="356.85"
                x="-890.28"
                height="295.13"
                width="463.85"
                fill="none"
                stroke="#70cbe2"
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="5.376"
                rx="9.63"
              />
            </g>
          </svg>
          {{ folder.name }} (ID {{ folder.id }})
        </a>
        <a
          v-if="folder.id === currentFolderId"
          href="#"
          @click.prevent="deleteFolder(folder.id)"
        >
          Delete folder
        </a>
      </div>
      <template v-if="folder.id === currentFolderId">
        <FileUpload
          v-if="folder.id === currentFolderId"
          :folderId="currentFolderId"
        />
        <ul class="file-list">
          <li v-for="file of folder.items">
            <a
              href="#"
              @click.prevent="
                showFileInfo(
                  file.id,
                  file.uploadId,
                  folder.id,
                  file.wrappedKey,
                  file.name,
                  file.type
                )
              "
            >
              {{ file.name }}
            </a>
            <a href="#" @click.prevent="selectFile(file.id)"> [Share] </a>
          </li>
        </ul>
      </template>
    </li>
  </ul>
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
