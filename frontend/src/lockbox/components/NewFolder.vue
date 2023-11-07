<script setup>
import { inject } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';

const { createFolder } = inject('folderManager');
</script>
<template>
  <Btn class="btn-primary" @click.prevent="createFolder">New Folder</Btn>
</template>
