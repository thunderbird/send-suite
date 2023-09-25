<script setup>
import { ref, inject } from 'vue';
import { download } from '@/lib/filesync';

const api = inject('api');
const user = inject('user');

// const emit = defineEmits(['']);
const props = defineProps({
	fileInfoObj: Object,
});

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
		wrappingKey = await keychain.get(folderId);
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

	const contentKey = await keychain.container.unwrapContentKey(
		wrappedKey,
		wrappingKey
	);

	await download(id, size, contentKey, false, fname, type);
}

</script>

<template>
	<h1>{{ fileInfoObj.filename }}</h1>
	<a href="#" @click.prevent="
		download(
			fileInfoObj.id,
			fileInfoObj.folderId,
			fileInfoObj.wrappedKey,
			fileInfoObj.filename,
		)
		">
		download
	</a>
	<ul>
		<li>{{ fileInfoObj.id }}</li>
		<li>
			{{ fileInfoObj.size }} bytes
		</li>
	</ul>
</template>

