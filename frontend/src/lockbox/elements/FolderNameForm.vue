<script setup>
import { inject, ref, onMounted } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';
import useFolderStore from '@/lockbox/stores/folder-store';

const emit = defineEmits(['renameComplete']);

const folderStore = useFolderStore();
const { renameFolder } = inject('folderManager');

const selectedFolderName = ref(folderStore.selectedFolder.name);
const input = ref(null);

async function updateFolderName() {
  console.log(`you want to change the name to ${selectedFolderName.value}`);

  const result = await renameFolder(folderStore.selectedFolder.id, selectedFolderName.value);
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
  <form @submit.prevent="updateFolderName">
    <input type="text" v-model="selectedFolderName" ref="input" />
    <div class="flex flex-row justify-end">
      <Btn @click="updateFolderName">Rename</Btn>
    </div>
  </form>
</template>
