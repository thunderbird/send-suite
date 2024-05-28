<script setup lang="ts">
import useUserStore from '@/stores/user-store';
import useFolderStore from '@/apps/lockbox/stores/folder-store';

import NewFolder from '@/apps/lockbox/components/NewFolder.vue';
import FileInfo from '@/apps/lockbox/components/FileInfo.vue';
import FolderInfo from '@/apps/lockbox/components/FolderInfo.vue';
import FolderNavigation from '@/apps/lockbox/components/FolderNavigation.vue';

const { user } = useUserStore();
const folderStore = useFolderStore();
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
