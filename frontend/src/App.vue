<script setup>
import { onMounted } from 'vue';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import { useRouter } from 'vue-router';
const router = useRouter();
const { user } = useUserStore();
const { keychain } = useKeychainStore();

onMounted(async () => {
  try {
    await keychain.load();
  } catch (e) {
    console.log(`no keys`);
    return;
  }
  console.log(`keychain loaded`);
  if (keychain.rsa.privateKey) {
    console.log(`we have keys, attempting to load user`);
    await user.load();
    await user.login();
  }
});
</script>

<template>
  <router-view></router-view>
</template>
