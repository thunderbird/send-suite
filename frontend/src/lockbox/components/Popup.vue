<script setup>
import { ref, inject, onMounted, watch } from 'vue';
import Upload from '@/common/Upload.vue';
import {
	EXTENSION_READY,
	UPLOAD_COMPLETE,
} from '@/lib/const';

const api = inject('api');
const user = inject('user');
const folders = ref([]);

const password = ref('');
const fileBlob = ref(null);
const isUploadReady = ref(false);
const folderId = ref(null);

async function uploadAndShare() {
	console.log(`hey. I don't do anything yet.`);
	isUploadReady.value = true;
}

function uploadComplete() {
	isUploadReady.value = false;
	fileBlob.value = null;
	console.log(`you should tell the user that it's done`)
	browser.runtime.sendMessage({
		type: UPLOAD_COMPLETE,
	});
	window.close();

}

function uploadAborted() {
	isUploadReady.value = false;
	console.log('upload aborted for reasons');
}

// 1. get a folder (later, the "default" one)
async function loadFolderList() {
	if (!user.value.id) {
		console.log(`no valid user id`);
		return;
	}
	const dirItems = await api.getAllFolders(user.value.id);
	console.log(dirItems);
	if (!dirItems) {
		return;
	}

	folders.value = dirItems;
	if (folders.value.length > 0) {
		folderId.value = folders.value[0].id
	}
}

watch(
	() => user.value.id,
	() => {
		loadFolderList();
		try {
			console.log(`adding listener in Popup for runtime messages`);
			browser.runtime.onMessage.addListener(async (message, sender) => {
				// console.log(message);
				const { data } = message;
				fileBlob.value = data;
				console.log(`We set the fileBlob to:`)
				console.log(data);
			});

			browser.runtime.sendMessage({
				type: EXTENSION_READY,
			})
		} catch (e) {
			console.log(`Cannot access browser.runtime, probably not running as an extension`);
		}

	}
);


</script>

<template>
	<h1>
		Lockbox attachment
	</h1>
	<form @submit.prevent="uploadAndShare">
		<br />
		<label>
			Password for sharing:
			<input type="password" v-model="password" />
		</label>
		<br />
		<input type="submit" value="Encrypt and Upload" />
	</form>
	<template v-if="isUploadReady">
		<Upload :containerId="folderId" :fileBlob="fileBlob" @uploadComplete="uploadComplete"
			@uploadAborted="uploadAborted" />
	</template>
</template>

