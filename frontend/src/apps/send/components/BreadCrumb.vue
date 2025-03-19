<script setup lang="ts">
import useFolderStore from '@/apps/send/stores/folder-store';
import { ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
const folderStore = useFolderStore();

const path = ref([]);

const router = useRouter();

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
      <button data-testid="home-button" @click="router.push('/send')">
        🏠
      </button>
    </li>
    <li
      v-for="node of path"
      v-if="folderStore.rootFolder"
      :key="node.id"
      class="inline-block pl-1"
    >
      &nbsp;&gt;&nbsp;
      <button
        @click.prevent="
          router.push({ name: 'folder', params: { id: node.id } })
        "
      >
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
