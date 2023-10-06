<script setup>
import { onMounted, inject } from 'vue';
import { download } from '@/lib/filesync';

const emit = defineEmits(['downloadComplete', 'downloadAborted']);
const props = defineProps({
	id: String,
	folderId: Number,
	wrappedKey: String,
	filename: String,
});

const api = inject('api');
const keychain = inject('keychain');

onMounted(() => {
	console.log(`Downloading file`);
	doDownload(props.id, props.folderId, props.wrappedKey, props.filename);
});

async function doDownload(id, folderId, wrappedKey, fname) {
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
	emit('downloadComplete');
}
</script>

<template>
	<h1>Progress Bar</h1>
</template>
