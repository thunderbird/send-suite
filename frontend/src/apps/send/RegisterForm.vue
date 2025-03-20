<script setup lang="ts">
import { dbUserSetup } from '@/lib/helpers';
import { trpc } from '@/lib/trpc';
import { validateEmail, validatePassword } from '@/lib/validations';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { useMutation } from '@tanstack/vue-query';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import useFolderStore from './stores/folder-store';

const email = ref('');
const password = ref('');
const emailError = ref('');
const passwordError = ref('');
const passwordConfirm = ref('');
const passwordConfirmError = ref('');

const { api } = useApiStore();
const router = useRouter();
const userStore = useUserStore();
const folderStore = useFolderStore();
const { keychain } = useKeychainStore();

const {
  mutate: registerMutation,
  error: registerError,
  data: registerData,
} = useMutation({
  mutationKey: ['registerUser'],
  mutationFn: async () => {
    const { state } = await trpc.registerUser.mutate({
      email: email.value,
      password: password.value,
    });
    await api.call(`auth/register?state=${state}`);
  },
  onSuccess: async () => {
    await dbUserSetup(userStore, keychain, folderStore);
    router.push('/send/profile');
  },
});

const handleSubmit = async () => {
  emailError.value = '';
  passwordError.value = '';
  passwordConfirmError.value = '';

  if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address';
    return;
  }

  if (!validatePassword(password.value)) {
    passwordError.value =
      'Password must be at least 12 characters long and contain at least one number and one special character';
    return;
  }

  if (password.value !== passwordConfirm.value) {
    passwordConfirmError.value = 'Passwords do not match';
    return;
  }

  registerMutation();
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="email"
        data-testid="email"
        type="email"
        required
        class="form-control"
      />
      <span v-if="emailError" class="error">{{ emailError }}</span>
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        id="password"
        v-model="password"
        data-testid="password"
        type="password"
        required
        class="form-control"
      />
      <span v-if="passwordError" class="error">{{ passwordError }}</span>
    </div>

    <div class="form-group">
      <label for="passwordConfirm">Confirm Password</label>
      <input
        id="passwordConfirm"
        v-model="passwordConfirm"
        data-testid="confirm-password"
        type="password"
        required
        class="form-control"
      />
      <span v-if="passwordConfirmError" class="error">{{
        passwordConfirmError
      }}</span>

      <span v-if="registerError" class="error">{{
        registerError.message
      }}</span>

      <div>{{ registerData }}</div>
    </div>

    <button type="submit" data-testid="submit-button">Register</button>
  </form>
</template>

<style scoped>
.form-group {
  margin-bottom: 15px;
}

.form-control {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
}

.error {
  color: red;
  font-size: 0.8em;
  margin-top: 4px;
  display: block;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
