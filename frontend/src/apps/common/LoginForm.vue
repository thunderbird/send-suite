<script setup lang="ts">
import { trpc } from '@/lib/trpc';
import { validatePassword } from '@/lib/validations';
import useApiStore from '@/stores/api-store';
import { useMutation } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useExtensionStore } from '../send/stores/extension-store';
import { useStatusStore } from '../send/stores/status-store';

const { onSuccess } = defineProps<{
  onSuccess: () => Promise<void>;
}>();

const email = ref('');
const password = ref('');
const emailError = ref('');
const passwordError = ref('');
const router = useRouter();
const { api } = useApiStore();
const { validators } = useStatusStore();
const { configureExtension } = useExtensionStore();

const {
  mutate: loginMutation,
  error: loginError,
  data: loginData,
} = useMutation({
  mutationKey: ['loginUser'],
  mutationFn: async () => {
    const { state } = await trpc.userLogin.mutate({
      email: email.value,
      password: password.value,
    });
    await api.call(`auth/login?state=${state}`);
  },
  onSuccess: async () => {
    await onSuccess();
    const { isTokenValid, hasBackedUpKeys } = await validators();
    if (isTokenValid && hasBackedUpKeys) {
      try {
        await configureExtension();
      } catch (error) {
        console.warn('You are running this outside TB', error);
      }
    }
    router.push('/send/profile');
  },
});

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValid = computed(() => {
  const isValidEmail = validateEmail(email.value);
  const isValidPassword = validatePassword(password.value);
  return isValidEmail && isValidPassword;
});

const handleSubmit = async () => {
  emailError.value = '';
  passwordError.value = '';

  if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address';
    return;
  }

  if (!validatePassword(password.value)) {
    passwordError.value =
      'Password must be at least 12 characters long and contain at least one number and one special character';
    return;
  }

  loginMutation();
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

      <span v-if="loginError" class="error">{{ loginError.message }}</span>
      <div>{{ loginData }}</div>
    </div>

    <button
      data-testid="login-submit-button"
      type="submit"
      :disabled="!isValid"
    >
      Login
    </button>
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
