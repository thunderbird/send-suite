<script setup>
import { onMounted, inject } from 'vue';
import { Util } from '@/lib/keychain';

const emit = defineEmits(['shareComplete', 'shareAborted']);
const props = defineProps({
	items: Array,
	password: String,
	// userIdArray: Array,    // TODO: accept an array of user IDs to share with
});

const api = inject('api');
const keychain = inject('keychain');
const user = inject('user');
/*
If I'm sharing a file, I just need its item id
	- basically sharing a new folder with a single item
If I'm sharing a whole folder, I need its folder id
	- and I'll need to copy existing items to the new folder
And if I'm sharing several files from an existing folder.


What's a share?
It's the folder that:
- is visible to a group of 2 (or more people)
- contains 1 or more existing items

In both cases:
- prompt for a password
	- TODO: a blank password means we'll auto-gen one and include in the url#hash
- create a container and key
- for each file:
	- unwrap the contentKey with old container key
	- wrap the contentKey with new container key
- create a new item, with wrapped key
	- set the new item's upload to existing uploadId
*/
onMounted(() => {
	console.log(`Creating Share link`);
	doShare();
})

async function doShare() {
	const containerId = await createNewShare(props.items, null, user.value.id);
	await requestShareLink(containerId, props.password);
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
	if (!props.password) {
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

	// Arbitrarily picked keychain.value.store to
	// confirm presence of keychain
	if (!api && !keychain.value.store) {
		console.log(`Need access to api and keychain`);
		return;
	}

	let itemsToShare = [...items];

	let currentContainer = { name: 'untitled' };
	if (containerId) {
		currentContainer = await api.getContainerInfo(containerId);
		// TODO: future enhancement
		// If there are no itemsToShare, get the items from the `currentContainer`
		// if (itemsToShare.length > 0) {
		// const { items } = await api.getContainerWithItems(containerId);
		// itemsToShare = items;
		// }
	}

	const response = await api.createFolder(userId, currentContainer.name);
	if (!(response || response.id)) {
		console.log(`could not create a new container for items`);
		return null;
	}

	const { id: newContainerId } = response;
	await keychain.value.newKeyForContainer(newContainerId);
	await keychain.value.store();

	await Promise.all(
		itemsToShare.map(async (item) => {
			// TODO: locate source of "folderId" property
			// rename to more generic "containerId"
			const currentWrappingKey = await keychain.value.get(item.folderId);
			const { filename, uploadId, wrappedKey, type } = item;
			const contentKey = await keychain.value.container.unwrapContentKey(
				wrappedKey,
				currentWrappingKey
			);

			// wrap the content key with the new container key
			const newWrappingKey = await keychain.value.get(newContainerId);

			const wrappedKeyStr = await keychain.value.container.wrapContentKey(
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
		})
	);

	return newContainerId;
}

async function requestShareLink(containerId, password) {
	// get the key (which unwraps it),
	console.log(`using password: ${password}`);
	const unwrappedKey = await keychain.value.get(containerId);

	// and password protect it
	const salt = Util.generateSalt();
	const passwordWrappedKeyStr = await keychain.value.password.wrapContainerKey(
		unwrappedKey,
		password,
		salt
	);

	const challengeKey = await keychain.value.challenge.generateKey();
	const challengeSalt = Util.generateSalt();

	const passwordWrappedChallengeKeyStr =
		await keychain.value.password.wrapContentKey(
			challengeKey,
			password,
			challengeSalt
		);

	const challengePlaintext = keychain.value.challenge.createChallenge();

	const challengeCiphertext = await keychain.value.challenge.encryptChallenge(
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
		user.value.id,
		challengePlaintext,
		challengeCiphertext
	);

	if (resp.id) {
		console.log(`created share link for container ${containerId}`);
		const hash = resp.id;
		const { origin } = new URL(window.location.href);
		const url = `${origin}/share/${hash}`;

		emit('shareComplete', url);
	}
}



</script>

<template>
	<h1>Imagine a spinner here.</h1>
</template>

