<script setup>
import { ref, onMounted, inject, watchEffect } from 'vue';
const { rootFolder, gotoRootFolder } = inject('folderManager');

const path = ref([]);

watchEffect(() => {
  path.value = [rootFolder.value];
  let parent = rootFolder.value.parent;
  while (parent) {
    path.value.unshift(parent);
    parent = parent.parent;
  }
});
</script>

<template>
  <ul>
    <li class="inline-block pl-1">
      <button @click="gotoRootFolder(null)">🏠</button>
    </li>
    <li v-for="node of path" class="inline-block pl-1">
      &nbsp;&gt;&nbsp;
      <button @click.prevent="gotoRootFolder(node.id)">
        {{ node.name }}
      </button>
    </li>
  </ul>
</template>
