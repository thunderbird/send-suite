// stores/counter.js
import { validator } from '@/lib/validations';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { useDebounceFn } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useStatusStore = defineStore('status', () => {
  const { api } = useApiStore();
  const userStore = useUserStore();
  const { keychain } = useKeychainStore();

  // Download status
  const total = ref(0);
  const progressed = ref(0);
  const error = ref<string>('');
  const debouncedUpdate = useDebounceFn((updatedValue: number) => {
    progressed.value = updatedValue;
  }, 100);

  function setUploadSize(size: number) {
    total.value = size;
  }

  function setProgress(number: number) {
    console.log('setting progress', number);
    debouncedUpdate(number);
  }

  const percentage = computed(() => {
    const result = (progressed.value * 100) / total.value;
    return Math.round(result);
  });

  const validators = () => validator({ api, keychain, userStore });

  return {
    validators,
    setProgress,
    setUploadSize,
    progress: {
      total,
      progressed,
      percentage,
      error,
    },
  };
});

export type StatusStore = ReturnType<typeof useStatusStore>;
export type ProgressTracker = StatusStore['setProgress'];
