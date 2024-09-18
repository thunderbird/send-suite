<script setup lang="ts">
import useSharingStore from '@/apps/lockbox/stores/sharing-store';
import useUserStore from '@/stores/user-store';
import { onMounted, ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['acceptAccessLinkComplete']);

const password = ref('');
const message = ref('');

const route = useRoute();
const router = useRouter();

const { user } = useUserStore();
const sharingStore = useSharingStore();

async function accept() {
  const isValid = await sharingStore.isAccessLinkValid(
    route.params.linkId as string
  );
  if (!isValid) {
    message.value = 'Access Link is no longer valid';
    return;
  }

  const success = await sharingStore.acceptAccessLink(
    route.params.linkId as string,
    password.value
  );
  if (success) {
    message.value = `and this is where we add the container to the group and then redirect`;

    if (user.id) {
      // Users will go to lockbox home
      router.push(`/lockbox`);
    } else {
      // Non-users stay at this route
      emit('acceptAccessLinkComplete');
    }
    emit('acceptAccessLinkComplete');
  }
}

onMounted(() => {
  const { hash } = window.location;
  if (hash) {
    password.value = hash.substring(1);
    console.log(`Setting password.value to ${password.value}`);
    accept();
  }
});
</script>

<template>
  <h1>Lockbox share</h1>
  <template v-if="user.email">
    <p>
      Hello,
      {{ user.email }}
    </p>
  </template>
  <p>
    The hash:
    {{ route.params.linkId }}
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
