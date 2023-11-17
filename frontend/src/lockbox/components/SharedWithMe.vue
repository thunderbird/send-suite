<script setup>
import { inject, computed } from 'vue';
import ContactCard from '@/lockbox/elements/ContactCard.vue';

const { sharedWithMe, showFoldersSharedBySender } = inject('sharingManager');

// get list of unique senders out of all invitations for the current user
const senders = computed(() => {
  const contacts = {};
  sharedWithMe.value.forEach(({ share }) => {
    contacts[share.sender.id] = share.sender;
  });
  return Object.values(contacts);
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <h2 class="font-bold">Shared By</h2>
    <div class="flex flex-wrap gap-4">
      <ContactCard
        v-for="sender in senders"
        :key="sender.id"
        :title="`No Name ${sender.id}`"
        :subtitle="sender.email"
        initials
        @click="showFoldersSharedBySender(sender.id)"
        class="cursor-pointer"
      />
    </div>
  </div>
</template>
