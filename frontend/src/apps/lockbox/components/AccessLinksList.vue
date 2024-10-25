<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import useSharingStore from '@/apps/lockbox/stores/sharing-store';
const sharingStore = useSharingStore();
const props = defineProps({
  folderId: Number,
});

watchEffect(async () => {
  await sharingStore.fetchAccessLinks(props.folderId);
});

/*
A note: we don't store the password.
So, the user has the option to change the expiration
and the user can delete the link.

But, there's no way to change the password, yet.
Theoretically, they can generate a new access link (and delete this one).

TODO: implement "regeneration" of links
*/
</script>
<template>
  <span
    v-if="sharingStore.links.length > 0"
    class="text-xs font-semibold text-gray-600"
    >Existing Links</span
  >
  <section class="flex flex-col gap-3" v-for="link in sharingStore.links">
    <label class="flex flex-col gap-2">
      <input type="text" class="!rounded-r-none" :value="link.id" />
    </label>
    <label class="flex flex-col gap-2 hidden">
      <span class="text-xs font-semibold text-gray-600">Link Expires</span>
      <input :value="link.expiryDate" type="datetime-local" />
    </label>
  </section>
</template>
