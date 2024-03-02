<script setup>
import { ref, computed, onMounted, toRaw } from 'vue';

// TODO: after proof-of-concept, move these to the sharing-store
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';

const { api } = useApiStore();
const { user } = useUserStore();

const received = ref([]);
const foldersBySenderId = computed(() => groupBySender(toRaw(received.value)));
const emailsBySenderId = computed(() => createEmailMap(toRaw(received.value)));

async function getReceivedFolders() {
  received.value = await api.getFoldersSharedWithUser(user.id);
}
onMounted(getReceivedFolders);

function createEmailMap(shareArray) {
  if (shareArray.length === 0) {
    return new Map();
  }
  const emailMap = new Map();
  shareArray.forEach(({ share }) => {
    const { sender } = share;
    emailMap.set(sender.id, sender.email);
  });
  return emailMap;
}

function groupBySender(shareArray) {
  if (shareArray.length === 0) {
    return new Map();
  }
  const senderMap = new Map();
  const seen = {};
  shareArray.forEach(({ share }) => {
    console.log(share);
    const { sender, container } = share;
    if (seen[container.id]) {
      return;
    }
    seen[container.id] = true;
    const containers = senderMap.get(sender.id) ?? [];
    senderMap.set(sender.id, [...containers, container]);
  });
  return senderMap;
}
</script>

<template>
  <h1>Stuff you've received as user {{ user.id }}</h1>
  <ul>
    <li v-for="[id, email] in emailsBySenderId">
      Sent by {{ id }} ({{ email }})
      <ul>
        <li v-for="folder in foldersBySenderId.get(id)">
          {{ folder }}
        </li>
      </ul>
    </li>
  </ul>
</template>
