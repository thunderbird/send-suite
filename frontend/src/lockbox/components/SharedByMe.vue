<script setup>
import { inject } from 'vue';
// Need a Core function that
// gets all containers owned by me
// with groups that have people other than me
// I need the members to those groups
// and the corresponding containers

const { sharedByMe } = inject('sharingManager');
</script>

<template>
  <h1>Shared By Me</h1>
  <ul>
    <li v-for="share of sharedByMe">
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
