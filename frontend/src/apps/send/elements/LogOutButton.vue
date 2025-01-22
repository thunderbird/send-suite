<script setup lang="ts">
type LogOutProps = {
  logOut: () => Promise<void>;
};

defineProps<LogOutProps>();
</script>

<template>
  <div class="container">
    <button size="small" @click.prevent="logOut">Log out</button>
  </div>
</template>

<style scoped>
button {
  color: var(--primary-default);
  padding: 10px 20px;
  cursor: pointer;
}
</style>
