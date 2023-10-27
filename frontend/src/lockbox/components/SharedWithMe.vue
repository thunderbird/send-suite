<script setup>
import { inject } from 'vue';
const { sharedWithMe } = inject('sharingManager');
</script>

<template>
  <h1>Shared With Me</h1>
  <ul>
    <li v-for="obj of sharedWithMe">
      folder name: {{ obj.share.container.name }}
      <br />
      shared by: {{ obj.share.sender.email }}
    </li>
  </ul>
</template>
