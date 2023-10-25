<script setup>
import { inject } from 'vue';
const { sharedByMe } = inject('sharingManager');
</script>

<template>
  <h1>Shared By Me</h1>
  <ul>
    <li v-for="share of sharedByMe">
      folder name: {{ share.container.name }}<br />
      folder id: {{ share.container.id }}<br />

      <!--
        A share can be shared with multiple people.
        Am I showing with whom?
        Or am I showing what I shared?
        What does the user want to access from this?
        Do they need to get to the user or the folder?
       -->
      <ul>
        <li v-for="invitation of share.invitations">
          {{ invitation.recipient.email }}
        </li>
      </ul>
    </li>
  </ul>
</template>
