<script setup>
import { inject } from 'vue';
const { sharedByMe } = inject('sharingManager');
</script>

<template>
  <h1>Shared By Me</h1>
  <ul>
    <li v-for="share of sharedByMe">
      folder name: {{ share.group.container.name }}<br />
      folder id: {{ share.group.container.id }}<br />
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
