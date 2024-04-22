<script setup>
import { inject, onMounted } from 'vue';
import ContactCard from '@/apps/lockbox/elements/ContactCard.vue';

const { invitations, acceptInvitation, getInvitations } = inject('sharingManager');

onMounted(() => {
  getInvitations();
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <h2 class="font-bold">
      Pending Invitations
      <button @click="getInvitations">🔁</button>
    </h2>
    <div class="flex flex-wrap gap-4">
      <ContactCard
        v-for="invite in invitations"
        :key="invite.share.container.id"
        :title="`Folder ID ${invite.share.container.id}`"
        :subtitle="invite.share.sender.email"
        class="cursor-pointer"
        @click="acceptInvitation(invite.share.container.id, invite.id, invite.wrappedKey)"
      />
    </div>
  </div>
</template>
