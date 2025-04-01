// Anytime we try to access import.meta.env, we need to check if it's running on the client or server
// This function will return true if it's running on the client
function isClientExecution(): boolean {
  try {
    if (import.meta.env.MODE) return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error(
      'This code is running on server, it should be executed only on client'
    );
  }
}

export const IS_PROD = isClientExecution()
  ? import.meta.env.MODE === 'production'
  : false;
export const IS_DEV = isClientExecution()
  ? import.meta.env.MODE === 'development'
  : false;

export const getEnvName = () => {
  isClientExecution();

  if (!import.meta.env.BASE_URL && !IS_DEV) {
    throw new Error('Environment variables object is required');
  }

  const base_url = import.meta.env.VITE_SEND_CLIENT_URL;

  if (base_url.includes('send.tb.pro')) {
    return 'production';
  }
  if (base_url.includes('send-stage.tb.pro')) {
    return 'staging';
  }
  if (base_url.includes('localhost')) {
    return 'development';
  }
};

export const getDomainName = (serverUlr: string) => {
  isClientExecution();

  // remove protocol and ports
  const serverUrl = serverUlr.replace(/^(https?:\/\/)?(www\.)?/, '');
  // split at the port if it exists
  const serverUri = serverUrl.split(':')[0];
  return serverUri;
};
