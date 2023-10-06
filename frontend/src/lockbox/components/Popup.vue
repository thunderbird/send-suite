<script setup>
import { ref, inject, watch } from 'vue';
import Upload from '@/common/Upload.vue';
import Share from '@/common/Share.vue';
import {
	EXTENSION_READY,
	SHARE_COMPLETE,
	SHARE_ABORTED,
} from '@/lib/const';

const api = inject('api');
const user = inject('user');
const folders = ref([]);

const password = ref('');
const fileBlob = ref(null);
const folderId = ref(null);
const itemObj = ref(null);
const isUploadReady = ref(false);
const isShareReady = ref(false);

async function uploadAndShare() {
	isUploadReady.value = true;
}

function uploadComplete(item) {
	isUploadReady.value = false;
	fileBlob.value = null;
	itemObj.value = [item];
	isShareReady.value = true;
}

function uploadAborted() {
	isUploadReady.value = false;
	console.log('upload aborted for reasons');
}

function shareComplete(url) {
	console.log(`you should tell the user that it's done`)
	browser.runtime.sendMessage({
		type: SHARE_COMPLETE,
		url,
		aborted: false
	});
	window.close();
	isShareReady.value = false;
}

function shareAborted() {
	console.log(`Could not finish creating share for Lockbox send`)
	browser.runtime.sendMessage({
		type: SHARE_ABORTED,
		url: '',
		aborted: true
	});
	window.close();
	isShareReady.value = false;
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

	// TODO: use a folder designated for uploads,
	// this is just using the first one
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
	<template v-if="isShareReady">
		<Share :items="itemObj" :password="password" @shareComplete="shareComplete" @shareAborted="shareAborted" />
	</template>
</template>

