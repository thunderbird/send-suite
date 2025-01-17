<script setup lang="ts">
import useSharingStore from '@/apps/lockbox/stores/sharing-store';
import { trpc } from '@/lib/trpc';
import { useMutation } from '@tanstack/vue-query';
import { ref, watch } from 'vue';

import Btn from '@/apps/lockbox/elements/BtnComponent.vue';
import { IconEye, IconEyeOff, IconLink } from '@tabler/icons-vue';
import { useClipboard, useDebounceFn } from '@vueuse/core';

const sharingStore = useSharingStore();

const props = defineProps<{
  folderId: number;
}>();

const emit = defineEmits(['createAccessLinkComplete', 'createAccessLinkError']);

const password = ref('');
const expiration = ref(null);
const accessUrl = ref('');
const showPassword = ref(false);
const tooltipText = ref('Copied to clipboard');
const clipboard = useClipboard();
const accessUrlInput = ref<HTMLInputElement | null>(null);

const { mutate } = useMutation({
  mutationKey: ['getAccessLink'],
  mutationFn: async () => {
    const [url, hash] = accessUrl.value.split('share/')[1].split('#');
    await trpc.addPasswordToAccessLink.mutate({
      linkId: url,
      password: hash,
    });
  },
});

const refreshAccessLinks = useDebounceFn(async () => {
  await sharingStore.fetchAccessLinks(props.folderId);
}, 1000);

function copyToClipboard(url: string) {
  clipboard.copy(url);
  tooltipText.value = 'Copied!';
  setTimeout(() => {
    tooltipText.value = 'Click to copy';
  }, 3000);
}

async function newAccessLink() {
  const url = await sharingStore.createAccessLink(
    props.folderId,
    password.value,
    expiration.value
  );

  if (!url) {
    emit('createAccessLinkError');
    return;
  }

  accessUrl.value = url;
  mutate();
  // Copy url to clipboard
  clipboard.copy(url);

  // Focus the input
  accessUrlInput.value?.focus();

  await refreshAccessLinks();
}

watch(
  () => props.folderId,
  () => {
    password.value = '';
    expiration.value = null;
    accessUrl.value = '';
    showPassword.value = false;
  }
);
</script>
<template>
  <section class="form-section">
    <label class="form-label">
      <span class="label-text">Create Share Link</span>
      <input
        ref="accessUrlInput"
        v-model="accessUrl"
        v-tooltip="tooltipText"
        type="text"
        class="input-field"
        @click="copyToClipboard(accessUrl)"
      />
    </label>
    <label class="form-label">
      <span class="label-text">Link Expires</span>
      <input v-model="expiration" type="datetime-local" />
    </label>
    <label class="form-label password-field">
      <span class="label-text">Password</span>
      <input v-model="password" :type="showPassword ? 'text' : 'password'" />
      <button
        class="toggle-password"
        @click.prevent="showPassword = !showPassword"
      >
        <IconEye v-if="showPassword" class="icon" />
        <IconEyeOff v-else class="icon" />
      </button>
    </label>
  </section>
  <Btn class="create-button" @click="newAccessLink">
    Create Share Link <IconLink class="icon" />
  </Btn>
</template>

<style scoped>
.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(75, 85, 99);
}

.password-field {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  bottom: 0.5rem;
  user-select: none;
}

.icon {
  width: 1rem;
  height: 1rem;
}

.create-button {
  margin-bottom: 2rem;
}
</style>
