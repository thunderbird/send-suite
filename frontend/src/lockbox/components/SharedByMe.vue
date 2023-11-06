<script setup>
import { inject, computed } from 'vue';
import ContactCard from '@/lockbox/elements/ContactCard.vue';

const { sharedByMe } = inject('sharingManager');

// get list of unique recipients out of all invitations from the current user
const recipients = computed(() => {
  const contacts = {};
  sharedByMe.value.forEach((share) => {
    share.invitations.forEach((invitation) => {
      contacts[invitation.recipientId] = invitation.recipient;
    });
  });
  return Object.values(contacts);
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <h2 class="font-bold">Shared With</h2>
    <div class="flex flex-wrap gap-4">
      <ContactCard
        v-for="recipient of recipients"
        :key="recipient.id"
        :title="'No Name'"
        :subtitle="recipient.email"
        initials
      />
    </div>
  </div>
</template>
