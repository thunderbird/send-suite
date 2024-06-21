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

const info = async (message: Logger) => {
  try {
    await api.call(
      'logger',
      { message: JSON.stringify(message), type: 'info' },
      'POST'
    );
    console.log(`${loggerPrefix.info} ${message}`);
  } catch {
    console.error('Failed to log message');
  }
};

const error = async (message: Logger) => {
  try {
    await api.call(
      'logger',
      { message: JSON.stringify(message), type: 'error' },
      'POST'
    );
    console.error(`${loggerPrefix.error} ${message}`);
  } catch {
    console.error('Failed to log error message');
  }
};

const warn = async (message: Logger) => {
  try {
    await api.call(
      'logger',
      { message: JSON.stringify(message), type: 'warn' },
      'POST'
    );
    console.warn(`${loggerPrefix.warn} ${message}`);
  } catch {
    console.error('Failed to log warn message');
  }
};

export default { info, error, warn };
