<script setup>
import { inject } from 'vue';
import ManageSharing from './ManageSharing.vue';
const { sharedByMe } = inject('sharingManager');
</script>

<template>
  <h1>Shared By Me</h1>
  <div v-for="share of sharedByMe">
    folder name: {{ share.container.name }}<br />
    folder id: {{ share.container.id }}<br />

    <!-- ok, this one is share-centric
    as in, the share has a container, invitations, and accessLinks

    -->
    <ManageSharing :folderId="share.container.id" />
  </div>
</template>

<style scoped>
div {
  outline: 1px solid grey;
}
</style>
