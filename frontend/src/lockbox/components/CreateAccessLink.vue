<script setup>
import { ref, inject } from 'vue';
import Sharer from '@/common/share';
const api = inject('api');
const userRef = inject('userRef');
const keychainRef = inject('keychainRef');

const props = defineProps({
  containerId: Number,
});

const emit = defineEmits(['createAccessLinkComplete', 'createAccessLinkError']);

const sharer = new Sharer(userRef, keychainRef, api);
const password = ref('abc');

async function newAccessLink() {
  const url = await sharer.requestAccessLink(props.containerId, password.value);
  if (!url) {
    emit('createAccessLinkError');
    return;
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
