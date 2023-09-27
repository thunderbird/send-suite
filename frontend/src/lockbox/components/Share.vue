<script setup>
import { ref, inject } from 'vue';
import { Util } from '@/lib/keychain';

const props = defineProps({
	items: Array,
	// containerId: number,
});

const keychain = inject('keychain');
const user = inject('user');
const api = inject('api');
/*
If I'm sharing a file, I just need its item id
	- basically sharing a new folder with a single item
If I'm sharing a whole folder, I need its folder id
	- and I'll need to copy existing items to the new folder
And if I'm sharing several files from an existing folder.


What's a share?
It's the folder that:
- is visible to a group of 2 (or more people) 
- contains 1 or more existing files


In both cases:
- prompt for a password
- create a container and key
- for each file:
	- unwrap the contentKey with old container key
	- wrap the contentKey with new container key
- create a new item, with wrapped key
	- set the new item's upload to existing uploadId


How much of this can I move to the Wrapper?

*/

const password = ref('abc');
const ephemeralHash = ref('');
const message = ref('');

async function share() {
	const containerId = await createNewShare(props.items, null, user.id);
	await requestShareLink(containerId, password.value);
}


// TODO: create a version that doesn't require a password
// instead, we're sharing with an existing user
/*
The items[] arg should have objects with 
{ 
	name,
	uploadId,
	wrappedKey,
	type	 
}
*/
async function createNewShare(items = [], containerId = null, userId = null) {
	if (!password) {
		console.log(`Password is required`);
		return;
	}
	if (!userId) {
		console.log(`User ID is required`);
		return;
	}

	if (items.length === 0 && !containerId) {
		console.log(`Nothing is being shared`);
		return;
	}

	if (!api && !keychain) {
		console.log(`Need access to api and keychain`);
		return;
	}

	let itemsToShare = [
		...items,
	];

	let currentContainer = { name: 'untitled' };
	if (containerId) {
		currentContainer = await api.getContainerInfo(containerId);
		// if (items.length > 0) {
		// const { items } = await api.getContainerWithItems(containerId);
		// itemsToShare = items;
		// }
	}

	const response = await api.createFolder(userId, currentContainer.name);
	if (!(response || response.id)) {
		console.log(`could not create a new container for items`);
		return null
	}

	const { id: newContainerId } = response;
	await keychain.newKeyForContainer(newContainerId);
	await keychain.store();


	await Promise.all(itemsToShare.map(async (item) => {

		// TODO: locate source of "folderId" property
		// rename to more generic "containerId" 
		const currentWrappingKey = await keychain.get(item.folderId);
		const { filename, uploadId, wrappedKey, type } = item;
		const contentKey = await keychain.container.unwrapContentKey(
			wrappedKey,
			currentWrappingKey
		);

		// wrap the content key with the new container key
		const newWrappingKey = await keychain.get(newContainerId);

		const wrappedKeyStr = await keychain.container.wrapContentKey(
			contentKey,
			newWrappingKey
		);

		// create the new item with the existing uploadId
		// in the newContainer
		const itemResp = await api.createItemInContainer(
			uploadId,
			newContainerId,
			filename,
			type,
			wrappedKeyStr
		);

		console.log(`🎉 here it is...`);
		console.log(itemResp);
		return itemResp;
	}));

	return newContainerId;
}

async function requestShareLink(containerId, password) {

	// get the key (which unwraps it),
	const unwrappedKey = await keychain.get(containerId);

	// and password protect it
	const salt = Util.generateSalt();
	const passwordWrappedKeyStr = await keychain.password.wrapContainerKey(
		unwrappedKey,
		password.value,
		salt
	);

	const challengeKey = await keychain.challenge.generateKey();
	const challengeSalt = Util.generateSalt();

	const passwordWrappedChallengeKeyStr =
		await keychain.password.wrapContentKey(
			challengeKey,
			password.value,
			challengeSalt
		);

	const challengePlaintext = keychain.challenge.createChallenge();

	const challengeCiphertext = await keychain.challenge.encryptChallenge(
		challengePlaintext,
		challengeKey,
		challengeSalt
	);

	// convert salts to base64 strings
	const saltStr = Util.arrayBufferToBase64(salt);
	const challengeSaltStr = Util.arrayBufferToBase64(challengeSalt);

	const resp = await api.createEphemeralLink(
		containerId,
		passwordWrappedKeyStr,
		saltStr,
		passwordWrappedChallengeKeyStr,
		challengeSaltStr,
		user.id,
		challengePlaintext,
		challengeCiphertext
	);

	if (resp.id) {
		console.log(`created ephemeral link for convo ${containerId}`);
		const hash = resp.id;
		const { origin } = new URL(window.location.href);
		const url = `${origin}/ephemeral/${hash}`;
		// const url = hash;
		ephemeralHash.value = url;
		message.value = '';
		// messageSocket.value.send(
		// 	JSON.stringify({
		// 		type: 'newChat',
		// 		// conversationId: props.conversationId,
		// 	})
		// );
	}
}
</script>

<template>
	<br />
	<hr />
	<h1>Share file or folder </h1>
	<label>
		Password:
		<input v-model="password" type="password" />
	</label>
	<br />
	<b v-if="message">
		{{ message }}
		<br />
	</b>
	<button class="btn-primary" @click="share">
		Share item
	</button>
	<br />
	<div v-if="ephemeralHash">
		<a :href="ephemeralHash" @click.prevent>{{ ephemeralHash }}</a>
	</div>
	<hr />
	<br />
</template>

<style scoped>
a {
	text-decoration: underline;
	color: #990099;
}
</style>
