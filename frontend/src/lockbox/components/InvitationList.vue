<script setup>
import { inject, onMounted } from 'vue';

const { invitations, acceptInvitation, getInvitations } =
  inject('sharingManager');

onMounted(() => {
  getInvitations();
});
</script>

<template>
  <h1>Pending Invitations</h1>
  <button class="btn-primary" @click="getInvitations">
    Check for invitations
  </button>
  <ul>
    <li v-for="invite of invitations">
      <a
        href="#"
        @click.prevent="
          acceptInvitation(
            invite.share.container.id,
            invite.id,
            invite.wrappedKey
          )
        "
      >
        invitation from {{ invite.share.sender.email }} for folder id
        {{ invite.share.container.id }}
      </a>
    </li>
  </ul>
</template>
