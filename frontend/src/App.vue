<script setup>
import { onMounted } from 'vue';
import init from '@/lib/init';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';

import { useRouter } from 'vue-router';
const router = useRouter();

const { user } = useUserStore();
const { keychain } = useKeychainStore();
const folderStore = useFolderStore();

onMounted(async () => {
  await init(user, keychain, folderStore);
});
</script>

<template>
  <router-view></router-view>
</template>
