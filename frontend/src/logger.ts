import { ApiConnection } from './lib/api';

type Logger = unknown;

export default {
  info: async (message: Logger) => {
    try {
      const url = import.meta.env.VITE_SEND_SERVER_URL;
      const api = new ApiConnection(url);
      await api.call(
        'logger',
        {
          message: JSON.stringify(message),
        },
        'POST'
      );

      console.log(`LOGGER INFO:
            
            ${message}
            `);
    } catch {
      console.error('Failed to log message');
    }
  },
};
