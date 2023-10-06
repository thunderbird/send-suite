<script setup>
import { ref, inject } from 'vue';
import { download } from '@/lib/filesync';
import CreateShare from './CreateShare.vue';

const api = inject('api');
const keychain = inject('keychain');
const user = inject('user');

const emit = defineEmits(['deleteComplete']);
const props = defineProps({
  fileInfoObj: Object,
});

// TODO: move these functions to filesync.js?
async function deleteItemAndContent(itemId, containerId) {
  const response = await api.deleteItem(itemId, containerId, true);
  if (response) {
    emit('deleteComplete');
  }
}
async function downloadContent(id, folderId, wrappedKey, fname) {
  if (!id) {
    console.log(`no id`);
    return;
  }
  if (!folderId) {
    console.log(`no id`);
    return;
  }

  let wrappingKey;
  try {
    wrappingKey = await keychain.value.get(folderId);
  } catch (e) {
    console.log(`cannot unwrap content key - no key for folder`);
    return;
  }

  // could use this so I can display the file size...
  // I'd need to move it
  const { size, type } = await api.getUploadMetadata(id);
  if (!size) {
    console.log(`no size`);
    return;
  }

  const contentKey = await keychain.value.container.unwrapContentKey(
    wrappedKey,
    wrappingKey
  );

  await download(id, size, contentKey, false, fname, type);
}
</script>

<template>
  <h1>{{ fileInfoObj.filename }}</h1>
  <a href="#" @click.prevent="
    downloadContent(
      fileInfoObj.uploadId,
      fileInfoObj.folderId,
      fileInfoObj.wrappedKey,
      fileInfoObj.filename
    )
    ">
    download
  </a>
  <a href="#" @click.prevent="
    deleteItemAndContent(fileInfoObj.itemId, fileInfoObj.folderId)
    ">
    delete
  </a>
  <ul>
    <li>{{ fileInfoObj.id }}</li>
    <li>{{ fileInfoObj.upload.size }} bytes</li>
    <li>{{ fileInfoObj.upload.type }} (mime type)</li>
  </ul>
  <CreateShare :items="[fileInfoObj]" />
</template>
