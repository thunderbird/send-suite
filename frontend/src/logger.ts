// We should type this propery to be the same type as console.log/error
type Logger = unknown;

const isProduction = import.meta.env.MODE === 'production';

export const loggerPrefix = {
  info: 'LOGGER INFO',
  error: 'LOGGER ERROR',
  warn: 'LOGGER WARNING',
};

const info = async (message: Logger) => {
  if (isProduction) {
    return;
  }
  console.log(`${loggerPrefix.info} ${message}`);
};

const error = async (message: Logger) => {
  console.error(`${loggerPrefix.error} ${message}`);
};

const warn = async (message: Logger) => {
  console.warn(`${loggerPrefix.warn} ${message}`);
};

export default { info, error, warn };
