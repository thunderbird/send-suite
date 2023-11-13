<script setup>
import { ref, inject } from 'vue';
import { Util } from '@/lib/keychain';
import Sharer from '@/common/share';

import Btn from '../elements/Btn.vue';

const api = inject('api');
const userRef = inject('userRef');
const keychainRef = inject('keychainRef');

const props = defineProps({
  folderId: Number,
});

const emit = defineEmits(['createAccessLinkComplete', 'createAccessLinkError']);

const sharer = new Sharer(userRef, keychainRef, api);
const password = ref('');
const expiration = ref(null);
const accessUrl = ref('');

async function newAccessLink() {
  let pw = password.value;
  let shouldAddPasswordAsHash = false;

  if (pw.length === 0) {
    pw = Util.generateRandomPassword();
    shouldAddPasswordAsHash = true;
  }

  console.log(`using password ${pw}`);
  let url = await sharer.requestAccessLink(
    props.folderId,
    pw,
    expiration.value
  );
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
      <input type="text" v-model="accessUrl" />
    </label>
    <label class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-gray-600">Link Expires</span>
      <input v-model="expiration" type="datetime-local" />
    </label>
    <label class="flex flex-col gap-2">
      <span class="text-xs font-semibold text-gray-600">Password</span>
      <input type="password" v-model="password" />
    </label>
  </section>
  <Btn class="mb-8" @click="newAccessLink">Create Share Link</Btn>
</template>
