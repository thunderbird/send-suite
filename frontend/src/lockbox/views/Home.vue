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
  <div class="flex flex-col items-start gap-4">
    <h1>{{ userRef.email }}'s Lockbox</h1>
    <NewFolder />
    <!-- <Breadcrumbs
      @setCurrentFolderId="setCurrentFolderId"
      :folderPath="folderPath"
    /> -->
    <InvitationList />
    <SharedWithMe />
    <SharedByMe />
    <div class="flex">
      <div>
        <FolderView />
      </div>
      <div>
        <div class="sticky top-4">
          <p>this is the file info component:</p>
          <FileInfo />
        </div>
      </div>
    </div>
  </div>
</template>
