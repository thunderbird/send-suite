<script setup>
import { inject } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';
import { IconPlus } from '@tabler/icons-vue';

const { createFolder } = inject('folderManager');
</script>
<template>
  <Btn primary @click="createFolder">
    <IconPlus class="w-5 h-5 stroke-2" />
    New Folder
  </Btn>
</template>
