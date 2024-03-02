<script setup>
import useUserStore from '@/stores/user-store';
import useFolderStore from '@/lockbox/stores/folder-store';

import NewFolder from '@/lockbox/components/NewFolder.vue';
import FileInfo from '@/lockbox/components/FileInfo.vue';
import FolderInfo from '@/lockbox/components/FolderInfo.vue';
import FolderNavigation from '@/lockbox/components/FolderNavigation.vue';
import RecentActivity from '@/lockbox/components/RecentActivity.vue';
import SharedByMe from '@/lockbox/components/SharedByMe.vue';
import SharedWithMe from '@/lockbox/components/SharedWithMe.vue';
import InvitationList from '@/lockbox/components/InvitationList.vue';

const { user } = useUserStore();
const folderStore = useFolderStore();

// const { currentFile, currentFolderId, rootFolderId } = inject('folderManager');
</script>

<template>
  <div class="flex min-h-screen">
    <aside class="w-64 border-r border-gray-300 bg-gray-50">
      <FolderNavigation />
    </aside>
    <div class="flex flex-col gap-4 grow">
      <header
        class="w-full sticky top-0 flex items-center justify-between px-4 py-2 bg-white/90 border-b border-gray-300"
      >
        <h1>{{ user.email }} Lockbox</h1>
        <NewFolder />
        <!-- <Breadcrumbs
          @setCurrentFolderId="setCurrentFolderId"
          :folderPath="folderPath"
        /> -->
      </header>
      <main class="flex flex-col gap-4 px-4">
        <router-view></router-view>
      </main>
    </div>
    <aside class="w-64 border border-gray-300 bg-gray-50 p-2.5">
      <FileInfo v-if="folderStore.selectedFile" />
      <FolderInfo v-if="folderStore.selectedFolder" />
    </aside>
  </div>
</template>
