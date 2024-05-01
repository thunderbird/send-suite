<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';
const folderStore = useFolderStore();

const path = ref([]);

watchEffect(() => {
  path.value = [folderStore.rootFolder];
  let parent = folderStore.rootFolder?.parent;
  while (parent) {
    path.value.unshift(parent);
    parent = parent.parent;
  }
});
</script>

<template>
  <ul>
    <li class="inline-block pl-1">
      <button @click="folderStore.goToRootFolder(null)">🏠</button>
    </li>
    <li v-if="folderStore.rootFolder" v-for="node of path" class="inline-block pl-1">
      &nbsp;&gt;&nbsp;
      <button @click.prevent="folderStore.goToRootFolder(node.id)">
        {{ node.name }}
      </button>
    </li>
  </ul>
</template>

<style scoped>
li,
button {
  user-select: none;
}
</style>
