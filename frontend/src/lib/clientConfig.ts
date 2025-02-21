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

  if (!import.meta.env.BASE_URL) {
    throw new Error('Environment variables object is required');
  }

  const base_url = import.meta.env.BASE_URL;
  if (base_url.includes('tb.pro')) {
    return 'production';
  }
  if (base_url.includes('thunderbird.dev')) {
    return 'staging';
  }
  if (base_url.includes('localhost')) {
    return 'development';
  }
};
