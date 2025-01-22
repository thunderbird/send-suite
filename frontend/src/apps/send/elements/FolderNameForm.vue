<script setup lang="ts">
import Btn from '@/apps/send/elements/BtnComponent.vue';
import useFolderStore from '@/apps/send/stores/folder-store';
import { onMounted, ref, watch } from 'vue';

const emit = defineEmits(['renameComplete']);

const folderStore = useFolderStore();

const selectedFolderName = ref(folderStore.selectedFolder.name);
const input = ref(null);

async function updateFolderName() {
  const result = await folderStore.renameFolder(
    folderStore.selectedFolder.id,
    selectedFolderName.value
  );
  if (result) {
    emit('renameComplete');
  }
}

function resetForm() {
  selectedFolderName.value = folderStore.selectedFolder.name;
  emit('renameComplete');
}

watch(
  () => folderStore.selectedFolder,
  () => {
    resetForm();
  }
);

onMounted(() => {
  input.value.focus();
  input.value.select();
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <form @submit.prevent="updateFolderName">
      <label class="flex flex-col gap-2">
        <input
          class="!rounded-r-none"
          type="text"
          v-model="selectedFolderName"
          ref="input"
          @keydown.esc="resetForm"
        />
        <div class="flex flex-row justify-end">
          <Btn @click="updateFolderName">Rename</Btn>
        </div>
      </label>
    </form>
  </section>
</template>
