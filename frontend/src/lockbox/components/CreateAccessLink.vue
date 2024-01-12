<script setup>
import { ref, inject } from 'vue';
import useSharingStore from '@/lockbox/stores/sharing-store';

import Btn from '@/lockbox/elements/Btn.vue';
import { IconLink, IconEye, IconEyeOff } from '@tabler/icons-vue';

const sharingStore = useSharingStore();

const props = defineProps({
  folderId: Number,
});

const emit = defineEmits(['createAccessLinkComplete', 'createAccessLinkError']);

const password = ref('');
const expiration = ref(null);
const accessUrl = ref('');
const showPassword = ref(false);

async function newAccessLink() {
  const url = await sharingStore.createAccessLink(props.folderId, password.value, expiration.value);

  if (!url) {
    // emit('createAccessLinkError');
    return;
  }

  accessUrl.value = url;
}
</script>
<template>
  <section class="flex flex-col gap-3">
    <label class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-gray-600">Create Share Link</span>
      <input type="text" v-model="accessUrl" class="!rounded-r-none" />
    </label>
    <label class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-gray-600">Link Expires</span>
      <input v-model="expiration" type="datetime-local" />
    </label>
    <label class="flex flex-col gap-2 relative">
      <span class="text-xs font-semibold text-gray-600">Password</span>
      <input :type="showPassword ? 'text' : 'password'" v-model="password" />
      <button @click.prevent="showPassword = !showPassword" class="absolute right-3 bottom-2 select-none">
        <IconEye v-if="showPassword" class="w-4 h-4" />
        <IconEyeOff v-else class="w-4 h-4" />
      </button>
    </label>
  </section>
  <Btn class="mb-8" @click="newAccessLink">Create Share Link <IconLink class="w-4 h-4" /></Btn>
</template>
