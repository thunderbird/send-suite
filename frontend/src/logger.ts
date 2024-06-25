import { ApiConnection } from './lib/api';

// We should type this propery to be the same type as console.log/error
type Logger = unknown;

export const loggerPrefix = {
  info: 'LOGGER INFO',
  error: 'LOGGER ERROR',
  warn: 'LOGGER WARNING',
};

const url = import.meta.env.VITE_SEND_SERVER_URL;
const api = new ApiConnection(url);

type LoggerType = 'info' | 'error' | 'warn';

function loggerApiCall({
  message,
  type,
}: {
  message: Logger;
  type: LoggerType;
}) {
  const timeStamp = new Date();
  return api.call(
    'logger',
    { message: JSON.stringify(message), type, timeStamp },
    'POST'
  );
}

const info = async (message: Logger) => {
  try {
    await loggerApiCall({ message, type: 'info' });
    console.log(`${loggerPrefix.info} ${message}`);
  } catch {
    console.error('Failed to log message');
  }
};

const error = async (message: Logger) => {
  try {
    await loggerApiCall({ message, type: 'error' });
    console.error(`${loggerPrefix.error} ${message}`);
  } catch {
    console.error('Failed to log error message');
  }
};

const warn = async (message: Logger) => {
  try {
    await loggerApiCall({ message, type: 'warn' });
    console.warn(`${loggerPrefix.warn} ${message}`);
  } catch {
    console.error('Failed to log warn message');
  }
};

export default { info, error, warn };
