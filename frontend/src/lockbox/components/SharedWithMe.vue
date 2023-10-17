<script setup>
import { inject } from 'vue';
const { sharedWithMe } = inject('sharingManager');
</script>

<template>
  <h1>Shared With Me</h1>
  <ul>
    <li v-for="share of sharedWithMe">
      folder name: {{ share.group.container.name }}
      <br />
      members:
      <ul>
        <li v-for="user of share.group.members">
          {{ user.user.email }}
        </li>
      </ul>
    </li>
  </ul>
</template>
