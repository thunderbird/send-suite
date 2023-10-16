<script setup>
import { ref, inject, watch } from 'vue';
import NewFolder from '../components/NewFolder.vue';
import FolderView from '../components/FolderView.vue';
import Breadcrumbs from '../components/Breadcrumbs.vue';
import FileInfo from '../components/FileInfo.vue';

const user = inject('user');
</script>

<template>
  <div class="lockbox-container">
    <h1>{{ user.email }}'s Lockbox</h1>
    <NewFolder />
    <!-- <Breadcrumbs
      @setCurrentFolderId="setCurrentFolderId"
      :folderPath="folderPath"
    /> -->
    <div class="lockbox-main">
      <div>
        <FolderView />
      </div>
      <div>
        <div class="lockbox-fileinfo">
          <p>this is the file info component:</p>
          <FileInfo />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lockbox-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.lockbox-main {
  display: flex;
  flex-direction: row;
}

.lockbox-fileinfo {
  position: sticky;
  top: 2rem;
}
</style>
