<script setup>
import { ref, inject } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';

import Sharer from '@/common/share';

// shouldn't I be getting this from the sharemanager?
const props = defineProps({
  items: Array,
  // containerId: number,
});

const { api } = useApiStore();
const { user } = useUserStore();

const { keychain } = useKeychainStore();
const { getFoldersSharedByMe } = inject('sharingManager');

const sharer = new Sharer(user, keychain, api);

const password = ref('abc');
const ephemeralHash = ref('');
const message = ref('');
// const isShareReady = ref(false);

async function shareItems() {
  // isShareReady.value = true;
  const url = await sharer.shareItemsWithPassword(props.items, password.value);
  if (!url) {
    shareAborted();
    return;
  }
  shareComplete(url);
  getFoldersSharedByMe();
}

function shareComplete(url) {
  ephemeralHash.value = url;
  // isShareReady.value = false;
  message.value = 'Share link created successfully';
}

function shareAborted() {
  // isShareReady.value = false;
  message.value = 'Could not create share';
  console.log('share aborted for reasons');
}
</script>

<template>
  <br />
  <hr />
  <h1>Share file or folder</h1>
  <label>
    Password:
    <input v-model="password" type="password" />
  </label>
  <br />
  <b v-if="message">
    {{ message }}
    <br />
  </b>
  <button class="btn-primary" @click="shareItems">Share item</button>
  <br />
  <div v-if="ephemeralHash">
    <a :href="ephemeralHash" @click.prevent>{{ ephemeralHash }}</a>
  </div>
  <!-- <hr />
  <br /> -->
  <!-- <template v-if="isShareReady">
    <Share :items="props.items" :password="password" @shareComplete="shareComplete" @shareAborted="shareAborted" />
  </template> -->
</template>

<style scoped>
a {
  text-decoration: underline;
  color: #990099;
}
</style>
