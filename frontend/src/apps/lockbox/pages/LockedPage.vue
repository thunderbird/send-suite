<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <h1>This folder is locked</h1>
  <p>
    The hash:
    {{ route.params.linkId }}
  </p>
</template>
