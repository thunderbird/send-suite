<script setup>
import { onMounted, inject } from 'vue';
import { sendBlob } from '@/lib/filesync';

const emit = defineEmits(['uploadComplete', 'uploadAborted']);
const props = defineProps({
  containerId: Number,
  fileBlob: Object,
});
const api = inject('api');
const user = inject('user');
const keychain = inject('keychain');

async function doUpload(isText = true) {
  if (!props.containerId) {
    console.log(`cannot upload - no folder selected`);
    emit('uploadAborted');
    return;
  }

  if (!props.fileBlob) {
    console.log(`cannot upload - no file blob provided`);
    emit('uploadAborted');
    return;
  }

  // get folder key
  const wrappingKey = await keychain.value.get(props.containerId);
  if (!wrappingKey) {
    console.log(`cannot upload - no key for conversation`);
  }

  // generate new AES key for the uploaded Content
  const key = await keychain.value.content.generateKey();

  // wrap the key for inclusion with the Item
  const wrappedKeyStr = await keychain.value.container.wrapContentKey(
    key,
    wrappingKey
  );

  const blob = props.fileBlob;
  const filename = blob.name;

  const id = await sendBlob(blob, key);
  if (!id) {
    console.log(`could not upload`);
    return;
  }
  console.log(`🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀`);
  console.log(blob.type);
  const uploadResp = await api.createContent(
    id,
    blob.size,
    user.value.id,
    blob.type
  );
  console.log(uploadResp);

  if (id !== uploadResp.id) {
    debugger;
  }

  const itemResp = await api.createItemInContainer(
    id,
    props.containerId,
    filename,
    isText ? 'MESSAGE' : 'FILE',
    wrappedKeyStr
  );
  console.log(`🎉 here it is...`);
  console.log(itemResp);
  emit('uploadComplete');
}

onMounted(() => {
  console.log(`Uploading and creating Item in Container`);
  doUpload();
});
</script>
<template>
  <h1>*imagine a spinnner or a progress bar*</h1>
</template>