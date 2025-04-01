import { formatLoginURL } from '@/lib/helpers';
import useApiStore from '@/stores/api-store';

export async function mozAcctLogin() {
  const { api } = useApiStore();
  const resp = await api.call<{ url: string }>(`lockbox/fxa/login`);
  if (!resp.url) {
    console.error(`Couldn't get a mozilla auth url`);
  }
  window.open(formatLoginURL(resp.url));
}
