<script setup lang="ts">
import useFolderStore from '@/apps/lockbox/stores/folder-store';

import Btn from '@/apps/lockbox/elements/Btn.vue';
import { IconPlus } from '@tabler/icons-vue';

const folderStore = useFolderStore();
</script>
<template>
  <Btn primary @click="folderStore.createFolder()">
    <IconPlus class="w-5 h-5 stroke-2" />
    New Folder
  </Btn>
</template>
