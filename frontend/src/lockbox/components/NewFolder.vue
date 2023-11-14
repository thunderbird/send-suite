<script setup>
import { inject } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';
import { IconPlus } from '@tabler/icons-vue';

// Assume that the folder should be created as a child of the currentFolderId
const { createFolder, rootFolderId } = inject('folderManager');
</script>
<template>
  <Btn primary @click="createFolder(rootFolderId)">
    <IconPlus class="w-5 h-5 stroke-2" />
    New Folder
  </Btn>
</template>
