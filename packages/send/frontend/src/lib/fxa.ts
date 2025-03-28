import { formatLoginURL } from '@/lib/helpers';
import useApiStore from '@/stores/api-store';
import { toRaw } from 'vue';

export async function mozAcctLogin(onSuccess: () => void) {
  const { api } = useApiStore();
  const resp = await api.call<{ url: string }>(`lockbox/fxa/login`);
  const url = resp.url;

  if (!url) {
    console.warn(`DEBUG: couldn't get a mozilla auth url`);
  }
  const win = window.open(formatLoginURL(url));
  const timer = setInterval(async () => {
    if (win.closed) {
      clearInterval(timer);
      onSuccess();
    }
  }, 500);
}

export function formatSessionInfo(info) {
  console.log(info);
  if (!info) {
    return null;
  }
  const val = structuredClone(toRaw(info));
  if (!val.user) {
    return info;
  }
  return JSON.stringify(val, null, 4);
}
