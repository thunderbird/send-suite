<script setup lang="ts">
import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import useUserStore from '@/stores/user-store';
import Btn from '../elements/BtnComponent.vue';

const userStore = useUserStore();

async function logOut() {
  await userStore.logOut();
  location.reload();
}
</script>
<template>
  <div class="container">
    <BackupAndRestore />
    <Btn size="small" @click.prevent="logOut">Log out</Btn>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  gap: 1rem 0;
  margin-top: 2rem;
}
p {
  color: #000;
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}
</style>
