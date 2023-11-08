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
  <div class="mb-4">
    <div class="font-bold mb-1 text-gray-600">
      Share Link
    </div>
    <input
      v-model="accessUrl"
      class="rounded-sm w-full px-2 py-2"
      placeholder="https://pro.thunderbird.com/abc123"
    />
  </div>
  <div class="mb-4">
    <div class="font-bold mb-1 text-gray-600">
      Link Expires
    </div>
    <input v-model="expiration" type="datetime-local" />
  </div>
  <div class="mb-4">
    <div class="font-bold mb-1 text-gray-600">
      Password
    </div>
    <input
      v-model="password"
      class="rounded-sm w-full px-2 py-2"
      type="password"
      placeholder="Optional password"
    />
  </div>
  <Btn class="mb-8" @click="newAccessLink">Create Share Link</Btn>
</template>
