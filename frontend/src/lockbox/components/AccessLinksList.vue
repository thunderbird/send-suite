<script setup>
import { ref, watchEffect } from 'vue';
import useSharingStore from '@/lockbox/stores/sharing-store';
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

I think I should do that and put the option here.


*/
</script>
<template>
  {{ props.folderId }}
  <br />
  {{ sharingStore.links }}
</template>
