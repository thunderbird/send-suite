<script setup lang="ts">
import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import UserDashboard from '@/apps/common/UserDashboard.vue';
import LogOutButton from '@/apps/send/elements/LogOutButton.vue';
import useUserStore from '@/stores/user-store';

const userStore = useUserStore();

async function logOut() {
  await userStore.logOut();
  location.reload();
}
</script>
<template>
  <div class="container">
    <UserDashboard />
    <BackupAndRestore />
    <log-out-button :log-out="logOut" />
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
