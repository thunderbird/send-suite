<script setup>
import { ref, onMounted } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';

const emit = defineEmits(['renameComplete']);

import useFolderStore from '@/lockbox/stores/folder-store';

const folderStore = useFolderStore();

const currentFileName = ref(folderStore.selectedFile.name);
const input = ref(null);

async function updateFileName() {
  const result = await folderStore.renameItem(
    folderStore.selectedFile.containerId,
    folderStore.selectedFile.id,
    currentFileName.value
  );
  if (result) {
    emit('renameComplete');
  }
}

onMounted(() => {
  input.value.focus();
  input.value.select();
});
</script>

<template>
  <form @submit.prevent="updateFileName">
    <input type="text" v-model="currentFileName" ref="input" />
    <div class="flex flex-row justify-end">
      <Btn @click="updateFileName">Rename</Btn>
    </div>
  </form>
</template>
