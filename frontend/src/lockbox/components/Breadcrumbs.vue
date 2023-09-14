<script setup>
import { ref, onMounted, inject, watch } from 'vue';
const emit = defineEmits(['setFolderId']);
const props = defineProps({
  folderPath: Array,
});

function loadFolder(id) {
  console.log(`you want to go to folder ${id}`);
  emit(`setFolderId`, id);
}
</script>
<template>
  <ul>
    <li v-for="folder of props.folderPath">
      <a href="#" @click.prevent="loadFolder(folder.id)">
        {{ folder.name }}
      </a>
    </li>
  </ul>
</template>

<style scoped></style>
