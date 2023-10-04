<script setup>
import { ref } from 'vue';
import Debug from '@/Debug.vue';
import Wrapper from '@/Wrapper.vue';

const password = ref('');
async function uploadAndShare() {
	console.log(`hey. I don't do anything yet.`);
}
</script>

<template>
	<Wrapper>
		<Debug />
		<h1>
			Lockbox attachment
		</h1>
		<h2>
			This is the page that the background.js needs to show.
		</h2>
		<form @submit.prevent="uploadAndShare">
			<label>
				Password:
				<input type="password" v-model="password" />
			</label>
			<br />
			<input type="submit" value="Encrypt and Upload" />
		</form>
	</Wrapper>
</template>
