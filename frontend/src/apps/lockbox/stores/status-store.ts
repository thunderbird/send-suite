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
  const text = ref<string>('');

  const debouncedUpdate = useDebounceFn((updatedValue: number) => {
    progressed.value = updatedValue;
  }, 1);

  function setText(message: string) {
    text.value = message;
  }

  function setUploadSize(size: number) {
    total.value = size;
  }

  function setProgress(number: number) {
    console.log('setting progress', number);
    debouncedUpdate(number);
  }

  function initialize() {
    total.value = 0;
    progressed.value = 0;
    error.value = '';
    text.value = '';
  }

  const percentage = computed(() => {
    const result = (progressed.value * 100) / total.value;
    if (Number.isNaN(result)) {
      return 0;
    }
    if (result > 100) {
      return 100;
    }
    return Math.round(result);
  });

  const validators = () => validator({ api, keychain, userStore });

  return {
    validators,
    setProgress,
    setUploadSize,
    setText,
    progress: {
      total,
      progressed,
      percentage,
      error,
      text,
      initialize,
      setProgress,
      setUploadSize,
      setText,
    },
  };
});

export type StatusStore = ReturnType<typeof useStatusStore>;
export type ProgressTracker = StatusStore['progress'];
