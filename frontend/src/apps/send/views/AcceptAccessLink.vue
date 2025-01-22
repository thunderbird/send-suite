<script setup lang="ts">
import useSharingStore from '@/apps/send/stores/sharing-store';
import useUserStore from '@/stores/user-store';
import { onMounted, ref } from 'vue';

import { getCanRetry } from '@/lib/validations';
import { useRoute } from 'vue-router';
import BtnComponent from '../elements/BtnComponent.vue';

const emit = defineEmits(['acceptAccessLinkComplete']);

const password = ref('');
const message = ref('');
const error = ref('');
const passwordInput = ref<HTMLInputElement | null>(null);
const isLocked = ref(false);

const route = useRoute();

const { user } = useUserStore();
const sharingStore = useSharingStore();

async function accept() {
  if (isLocked.value) return;
  error.value = ''; // Clear previous errors
  const linkId = route.params.linkId as string;
  const isValid = await sharingStore.isAccessLinkValid(linkId);
  const canRetry = await getCanRetry(linkId);

  if (!isValid || !canRetry) {
    error.value = 'Access Link is no longer valid';
    isLocked.value = true;
    return;
  }

  try {
    const success = await sharingStore.acceptAccessLink(linkId, password.value);
    if (success) {
      message.value = `and this is where we add the container to the group and then redirect`;

      /*
      This functionality has been disabled until we test it
      We want users to be able to download files without adding them to their folers
       */
      // if (user.id) {
      //   // Users will go to send home
      //   router.push(`/send`);
      // } else {
      //   // Non-users stay at this route
      //   emit('acceptAccessLinkComplete');
      // }
      emit('acceptAccessLinkComplete');
    } else {
      error.value = 'This password is incorrect';
    }
  } catch (e) {
    console.error(e);
    error.value = 'An error occurred while processing your request';
  }
}

onMounted(() => {
  const { hash } = window.location;
  if (hash) {
    password.value = hash.substring(1);
    accept();
  } else {
    // Focus the password input if no hash is present
    passwordInput.value?.focus();
  }
});
</script>

<template>
  <h1>Share</h1>
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
  <form @submit.prevent="accept">
    <label>
      Password:
      <input
        ref="passwordInput"
        v-model="password"
        autocomplete="section-main password"
        type="password"
        required
      />
    </label>
    <div v-if="message">{{ message }}</div>
    <div v-if="error" class="error-message" style="color: red">{{ error }}</div>
    <div v-if="!isLocked">
      <BtnComponent primary class="btn-primary" type="submit">Go</BtnComponent>
    </div>
  </form>
</template>
