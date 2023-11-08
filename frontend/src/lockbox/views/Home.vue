<script setup>
import { inject } from 'vue';
import NewFolder from '@/lockbox/components/NewFolder.vue';
import FolderView from '@/lockbox/components/FolderView.vue';
import Breadcrumbs from '@/lockbox/components/Breadcrumbs.vue';
import FileInfo from '@/lockbox/components/FileInfo.vue';
import FolderInfo from '@/lockbox/components/FolderInfo.vue';
import SharedByMe from '@/lockbox/components/SharedByMe.vue';
import SharedWithMe from '@/lockbox/components/SharedWithMe.vue';
import InvitationList from '@/lockbox/components/InvitationList.vue';

const userRef = inject('userRef');
const { currentFile, currentFolderId } = inject('folderManager');
</script>

<template>
  <div class="flex min-h-screen">
    <div class="flex flex-col gap-4 grow">
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
        <FolderView />
      </main>
    </div>
    <aside v-if="currentFile || currentFolderId" class="w-64 border-l border-gray-300 bg-gray-50 p-2.5">
      <FileInfo />
      <FolderInfo />
    </aside>
  </div>
</template>
