<script setup>
import { ref, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['acceptAccessLinkComplete']);

const password = ref('');
const message = ref('');

const route = useRoute();
const router = useRouter();

const userRef = inject('userRef');

const { acceptAccessLink } = inject('sharingManager');

async function accept() {
  const success = await acceptAccessLink(route.params.hash, password.value);
  if (success) {
    message.value = `and this is where we add the container to the group and then redirect`;

    if (userRef.value.id) {
      // Users will go to lockbox home
      router.push(`/lockbox`);
    } else {
      // Non-users stay at this route
      emit('acceptAccessLinkComplete');
    }
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
