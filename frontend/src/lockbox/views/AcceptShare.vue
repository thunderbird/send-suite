<script setup>
import { ref, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const password = ref('');
const message = ref('');

const route = useRoute();
const router = useRouter();

const userRef = inject('userRef');

const { acceptShare } = inject('sharingManager');

async function accept() {
  const success = await acceptShare(route.params.hash, password.value);
  if (success) {
    message.value = `and this is where we add the container to the group and then redirect`;
    router.push('/lockbox');
  }
}
</script>

<template>
  <h1>Lockbox share</h1>
  <template v-if="userRef.email">
    <p>
      Hello,
      {{ userRef.email }}
    </p>
  </template>
  <p>
    The hash:
    {{ route.params.hash }}
  </p>
  <label>
    Password:
    <input v-model="password" type="password" />
  </label>
  <div>
    {{ message }}
  </div>
  <button class="btn-primary" @click="accept">Go</button>
</template>
