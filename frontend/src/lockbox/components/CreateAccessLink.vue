<script setup>
import { ref, inject } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';

import { Util } from '@/lib/keychain';
import Sharer from '@/common/share';
import Btn from '@/lockbox/elements/Btn.vue';
import { IconLink, IconEye, IconEyeOff } from '@tabler/icons-vue';

const { api } = useApiStore();
const { user } = useUserStore();

const keychainRef = inject('keychainRef');

const props = defineProps({
  folderId: Number,
});

const emit = defineEmits(['createAccessLinkComplete', 'createAccessLinkError']);

const sharer = new Sharer(user, keychainRef, api);
const password = ref('');
const expiration = ref(null);
const accessUrl = ref('');
const showPassword = ref(false);

async function newAccessLink() {
  let pw = password.value;
  let shouldAddPasswordAsHash = false;

  if (pw.length === 0) {
    pw = Util.generateRandomPassword();
    shouldAddPasswordAsHash = true;
  }

  console.log(`using password ${pw}`);
  let url = await sharer.requestAccessLink(props.folderId, pw, expiration.value);
  if (!url) {
    // emit('createAccessLinkError');
    return;
  }
  if (shouldAddPasswordAsHash) {
    url = `${url}#${pw}`;
  }

  accessUrl.value = url;
  // emit('createAccessLinkComplete', url);
}
</script>
<template>
  <section class="flex flex-col gap-3">
    <label class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-gray-600">Share Link</span>
      <div class="flex">
        <input type="text" v-model="accessUrl" class="!rounded-r-none" />
        <Btn primary class="!rounded-l-none !px-1.5"><IconLink class="w-4 h-4" /></Btn>
      </div>
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
  <Btn class="mb-8" @click="newAccessLink">Create Share Link</Btn>
</template>
