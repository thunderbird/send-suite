<script setup lang="ts">
import { trpc } from '@/lib/trpc';
import { validateEmail, validatePassword } from '@/lib/validations';
import useApiStore from '@/stores/api-store';
import { useMutation } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const emailError = ref('');
const passwordError = ref('');
const passwordConfirm = ref('');
const passwordConfirmError = ref('');

const { api } = useApiStore();
const router = useRouter();

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
  onSuccess: () => {
    router.push('/send/profile');
  },
});

const validatePasswords = (): boolean => {
  return (
    validatePassword(password.value) && password.value === passwordConfirm.value
  );
};

const isValid = computed(() => {
  const isValidEmail = validateEmail(email.value);
  const isValidPassword = validatePasswords();

  return isValidEmail && isValidPassword;
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
        data-testid="email"
        v-model="email"
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
        data-testid="password"
        v-model="password"
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
        data-testid="confirm-password"
        v-model="passwordConfirm"
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

    <button type="submit" data-testid="submit-button" :disabled="!isValid">
      Register
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
