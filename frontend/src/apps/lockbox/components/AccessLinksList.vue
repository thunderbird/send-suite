<script setup lang="ts">
import { BASE_URL } from '@/apps/common/constants';
import useSharingStore from '@/apps/lockbox/stores/sharing-store';
import { useClipboard } from '@vueuse/core';
import { vTooltip } from 'floating-vue';
import { ref, watchEffect } from 'vue';

type Props = {
  folderId: number;
};
const sharingStore = useSharingStore();
const props = defineProps<Props>();
const clipboard = useClipboard();

const tooltipText = ref('Click to copy');

watchEffect(async () => {
  await sharingStore.fetchAccessLinks(props.folderId);
});

function copyToClipboard(id: string) {
  clipboard.copy(`${BASE_URL}/share/${id}`);
  tooltipText.value = 'Copied!';
  setTimeout(() => {
    tooltipText.value = 'Click to copy';
  }, 3000);
}

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
  <section
    v-for="link in sharingStore.links"
    :key="link.id"
    class="flex flex-col gap-3"
  >
    <input
      v-tooltip="tooltipText"
      type="text"
      :value="`${BASE_URL}/share/${link.id}`"
      @click="copyToClipboard(link.id)"
    />
    <label class="flex-col gap-2 hidden">
      <span class="text-xs font-semibold text-gray-600">Link Expires</span>
      <input :value="link.expiryDate" type="datetime-local" />
    </label>
  </section>
</template>
