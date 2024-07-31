import useMetricsStore from '@/stores/metrics';
import useUserStore from '@/stores/user-store';
import { onBeforeUnmount, onMounted } from 'vue';

/*
 * This mixin is used to update the client metrics identity when the user logs in
 * we do it on focus because after we close the fxa login window, we have to re-populate the values
 */
export function useMetricsUpdate() {
  const userStore = useUserStore();
  const { initializeClientMetrics } = useMetricsStore();

  const updateMetricsIdentity = async () => {
    /*
     * TODO: Update this function to check for the hashed value in store, if it's not there, try to populate it from session
     * and then initialize the client metrics with the hashed email
     * if it's there already, skip initializaiton
     */
    await userStore.populateFromSession();
    const uid = userStore.user.hashedEmail;
    initializeClientMetrics(uid);
  };

  onMounted(() => {
    window.addEventListener('focus', updateMetricsIdentity);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('focus', updateMetricsIdentity);
  });

  return { updateMetricsIdentity };
}
