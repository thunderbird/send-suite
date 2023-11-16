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
    <li>
      <a href="#" @click.prevent="gotoRootFolder(null)"> 🏠 </a>
    </li>
    <li v-for="node of path">
      <a href="#" @click.prevent="gotoRootFolder(node.id)">
        {{ node.name }}
      </a>
    </li>
  </ul>
</template>

<style scoped>
li {
  display: inline-block;
  padding-left: 0.25rem;
}
li + li::before {
  content: '> ';
}
</style>
