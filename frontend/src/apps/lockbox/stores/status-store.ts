// stores/counter.js
import { validator } from '@/lib/validations';
import useApiStore from '@/stores/api-store';
import useConfigurationStore from '@/stores/configuration-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { defineStore } from 'pinia';

const DEBUG = true;
const SERVER = `server`;

export const useStatusStore = defineStore('status', () => {
  const { api } = useApiStore();
  const userStore = useUserStore();
  const { keychain } = useKeychainStore();

  const { serverUrl, setServerUrl } = useConfigurationStore();

  const validators = () => validator({ api, keychain, userStore });

  // This specifies the id of the provider chosen in the
  // "Composition > Attachments" window.
  // This is necessary only for the management page.
  const accountId = new URL(location.href).searchParams.get('accountId');

  function setAccountConfigured(accountId) {
    // Let TB know that extension is ready for use with cloudFile API.
    try {
      //@ts-ignore
      browser.cloudFile.updateAccount(accountId, {
        configured: true,
      });
    } catch (e) {
      console.log(
        `setAccountConfigured: You're probably running this outside of Thundebird`
      );
    }
  }

  async function configureExtension() {
    // This should only run on TB
    if (!accountId) {
      return;
    }
    console.log(`

  Configuring extension with:

  accountId: ${accountId}
  SERVER: ${SERVER}
  currentServerUrl.value: ${serverUrl.value}

  `);

    return browser.storage.local
      .set({
        [accountId]: {
          [SERVER]: serverUrl.value,
        },
      })
      .catch((error) => {
        console.log(error);
      })
      .then(() => {
        setAccountConfigured(accountId);
        setServerUrl(serverUrl.value);
        DEBUG &&
          browser.storage.local.get(accountId).then((accountInfo) => {
            if (accountInfo[accountId] && SERVER in accountInfo[accountId]) {
              setServerUrl(accountInfo[accountId][SERVER]);
              setAccountConfigured(accountId);
            } else {
              console.log(`You probably need to wait longer`);
            }
          });
      });
  }

  return {
    validators,
    configureExtension,
    serverUrl,
    setServerUrl,
  };
});
