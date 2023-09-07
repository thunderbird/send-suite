<script setup>
import { ref, inject } from 'vue';
const props = defineProps({
  conversationId: Number,
});

const { user } = inject('user');
const api = inject('api');
const keychain = inject('keychain');
const recipientId = ref(null);

const message = ref('');

async function addPerson() {
  // When you wake, MAKE THIS WORK
  // - you need something like api.getUserPublicKey
  //    this is what you'll use to wrap the AES key
  const publicKeyResp = await api.getUserPublicKey(recipientId.value);
  if (publicKeyResp) {
    const { publicKey } = publicKeyResp;

    const importedPublicKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(publicKey),
      {
        name: 'RSA-OAEP',
        hash: { name: 'SHA-256' },
      },
      true,
      ['wrapKey']
    );

    const wrappedKey = await keychain.getAndWrapContainerKey(
      props.conversationId,
      importedPublicKey
    );

    const resp = await api.inviteGroupMember(
      props.conversationId,
      wrappedKey,
      recipientId.value,
      user.value.id
    );
    if (resp) {
      message.value = `User ${recipientId.value} invited`;
    }
  }
}
function dismiss() {
  message.value = '';
}
</script>

<template>
  <div v-if="message">
    <h2>{{ message }}</h2>
    <button
      class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      @click="dismiss"
    >
      dismiss
    </button>
  </div>
  <div v-if="props.conversationId">
    <label>
      User ID:
      <input type="nubmer" v-model="recipientId" />
    </label>
    <button
      class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      @click="addPerson"
    >
      Add Person
    </button>
  </div>
</template>
