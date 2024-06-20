import { ApiConnection } from './lib/api';
type Logger = unknown;

export default {
  info: async (message: Logger) => {
    try {
      const url = import.meta.env.VITE_SEND_SERVER_URL;
      const api = new ApiConnection(url);
      await api.call(
        'logger',
        { message: JSON.stringify(message), type: 'info' },
        'POST'
      );
      console.log(`LOGGER INFO: ${message}`);
    } catch {
      console.error('Failed to log message');
    }
  },
  error: async (message: Logger) => {
    const url = import.meta.env.VITE_SEND_SERVER_URL;
    const api = new ApiConnection(url);
    try {
      await api.call(
        'logger',
        { message: JSON.stringify(message), type: 'error' },
        'POST'
      );
      console.log(`LOGGER ERROR: ${message}`);
    } catch {
      console.error('Failed to log error message');
    }
  },
};
