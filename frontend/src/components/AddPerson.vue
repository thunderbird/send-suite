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

    const wrappedKey = await keychain.getAndWrap(
      props.conversationId,
      importedPublicKey
    );

    // // ^^^^^ THIS HASN'T BEEN TESTED YET
    const resp = await api.shareKeyWithGroupMember(
      props.conversationId,
      wrappedKey,
      recipientId.value,
      user.value.id
    );
    if (resp) {
      message.value = `User ${recipientId.value} invited`;
    }
  }

  function dismiss() {
    message.value = '';
  }
}
</script>

<template>
  <div v-if="message">
    <h2>{{ message }}</h2>
    <button @click="dismiss">dismiss</button>
  </div>
  <div v-if="props.conversationId">
    <label>
      User ID:
      <input type="nubmer" v-model="recipientId" />
    </label>
    <button @click="addPerson">Add Person</button>
  </div>
</template>
