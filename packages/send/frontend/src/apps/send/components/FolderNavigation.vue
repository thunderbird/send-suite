<script setup lang="ts">
import useFolderStore from '@/apps/send/stores/folder-store';

import DragAndDropUpload from '@/apps/send/components/DragAndDropUpload.vue';

const folderStore = useFolderStore();
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <!-- actions -->
    <header class="flex items-center justify-between pt-2 px-2.5"></header>
    <!-- upload zone -->
    <section class="px-2.5">
      <DragAndDropUpload v-if="folderStore.rootFolder">
        <div
          class="h-36 flex justify-center items-center text-center font-bold text-lg text-gray-500 border-4 border-dashed border-gray-300 rounded-lg"
        >
          Drag &amp; Drop<br />
          files here to upload
        </div>
      </DragAndDropUpload>
    </section>
    <section class="flex flex-col gap-2 p-2.5">
      <ul>
        <li data-tesid="my-files-link">
          <router-link to="/send">My Files</router-link>
        </li>
        <li data-tesid="profile-link">
          <router-link to="/send/profile">Profile</router-link>
        </li>
      </ul>
    </section>
  </div>
</template>
