// We should type this propery to be the same type as console.log/error
type Logger = unknown;

export const loggerPrefix = {
  info: 'LOGGER INFO',
  error: 'LOGGER ERROR',
  warn: 'LOGGER WARNING',
};

const info = (message: Logger) => {
  console.log(`${loggerPrefix.info} ${message}`);
};

const error = (message: Logger) => {
  console.error(`${loggerPrefix.error} ${message}`);
};

const warn = (message: Logger) => {
  console.warn(`${loggerPrefix.warn} ${message}`);
};

export default { info, error, warn };
