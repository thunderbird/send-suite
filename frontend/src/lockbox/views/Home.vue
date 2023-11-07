<script setup>
import { inject } from 'vue';
import NewFolder from '../components/NewFolder.vue';
import FolderView from '../components/FolderView.vue';
import Breadcrumbs from '../components/Breadcrumbs.vue';
import FileInfo from '../components/FileInfo.vue';
import SharedByMe from '../components/SharedByMe.vue';
import SharedWithMe from '../components/SharedWithMe.vue';
import InvitationList from '../components/InvitationList.vue';

const userRef = inject('userRef');
</script>

<template>
  <div class="flex flex-col gap-4">
    <header class="w-full sticky top-0 flex justify-between px-4 py-2 bg-white/90 border-b border-gray-300">
      <h1>{{ userRef.email }}'s Lockbox</h1>
      <NewFolder />
      <!-- <Breadcrumbs
        @setCurrentFolderId="setCurrentFolderId"
        :folderPath="folderPath"
      /> -->
    </header>
    <main class="flex flex-col gap-4 px-4">
      <InvitationList />
      <SharedWithMe />
      <SharedByMe />
      <div class="flex">
        <FolderView />
        <FileInfo />
      </div>
    </main>
  </div>
</template>
