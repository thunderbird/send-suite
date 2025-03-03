<script lang="ts" setup>
const { id } = defineProps<{
  id: number;
}>();
</script>

<template>
  <h2>Account</h2>
  <p>You’ll need to login to your Mozilla account to use Thunderbird Send</p>
  <p v-if="id">Your session has expired, please log back in</p>
  <slot></slot>
</template>
