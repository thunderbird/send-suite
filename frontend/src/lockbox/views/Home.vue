<script setup>
import { inject } from 'vue';
import NewFolder from '../components/NewFolder.vue';
import FolderView from '../components/FolderView.vue';
import Breadcrumbs from '../components/Breadcrumbs.vue';
import FileInfo from '../components/FileInfo.vue';
import SharedByMe from '../components/SharedByMe.vue';
import SharedWithMe from '../components/SharedWithMe.vue';
import InvitationList from '../components/InvitationList.vue';
import FolderDetail from '../components/FolderDetail.vue';


const userRef = inject('userRef');
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4">
    <header class="w-full sticky top-0 flex justify-between px-4 py-2 bg-white/90 border-b border-gray-300">
      <h1 v-if="userRef.email">{{ userRef.email }}'s Lockbox</h1>
      <NewFolder />
      <!-- <Breadcrumbs
        @setCurrentFolderId="setCurrentFolderId"
        :folderPath="folderPath"
      /> -->
    </header>
    <main class="w-full h-full flex flex-row">
      <!-- Left sidebar -->
      <div class="w-full sm:w-1/3 md:w-1/4 px-2">
        <h1>
          <!-- Drag and Drop -->

        </h1>
        <h1>
          <!-- Recent Activity -->

        </h1>
        <h1>
          <!-- Tags -->
        </h1>
      </div>

      <!-- Main/center panel-->
      <div class="w-full h-full flex flex-col gap-4 px-4 bg-slate-300">
        <InvitationList />
        <SharedWithMe />
        <SharedByMe />
        <FolderView />
      </div>

      <!-- Right -->
      <div class="w-full h-full sm:w-1/3 md:w-1/4 px-2">
        <FolderDetail />
        <!-- <div class="sticky top-4">
          <p>this is the file info component:</p>
          <FileInfo />
        </div> -->
      </div>
    </main>
  </div>
</template>
