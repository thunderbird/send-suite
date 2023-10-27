<script setup>
import { ref, inject } from 'vue';
import { Util } from '@/lib/keychain';

import Sharer from '@/common/share';
const api = inject('api');
const userRef = inject('userRef');
const keychainRef = inject('keychainRef');

const props = defineProps({
  containerId: Number,
});

const emit = defineEmits(['createAccessLinkComplete', 'createAccessLinkError']);

const sharer = new Sharer(userRef, keychainRef, api);
const password = ref('');

async function newAccessLink() {
  let pw = password.value;
  let shouldAddPasswordAsHash = false;

  if (pw.length === 0) {
    pw = Util.generateRandomPassword();
    shouldAddPasswordAsHash = true;
  }

  console.log(`using password ${pw}`);
  let url = await sharer.requestAccessLink(props.containerId, pw);
  if (!url) {
    emit('createAccessLinkError');
    return;
  }
  if (shouldAddPasswordAsHash) {
    url = `${url}#${pw}`;
  }

  emit('createAccessLinkComplete', url);
}
</script>
<template>
  <form @submit.prevent="newAccessLink">
    <label>
      Password:
      <input v-model="password" type="password" />
    </label>
    <input type="submit" value="Create Access Link" />
  </form>
</template>
