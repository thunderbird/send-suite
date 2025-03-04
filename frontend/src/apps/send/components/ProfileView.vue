<script setup lang="ts">
import BackupAndRestore from '@/apps/common/BackupAndRestore.vue';
import SecureSendIcon from '@/apps/common/SecureSendIcon.vue';
import UserDashboard from '@/apps/common/UserDashboard.vue';
</script>
<template>
  <div class="container">
    <UserDashboard />
    <BackupAndRestore />
    <SecureSendIcon />
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
