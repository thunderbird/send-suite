<script setup>
import { inject } from 'vue';
const { createFolder } = inject('folderManager');
</script>
<template>
  <button class="btn-primary" @click.prevent="createFolder">New Folder</button>
</template>
