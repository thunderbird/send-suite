/* eslint-disable @typescript-eslint/no-explicit-any */
// We should type this propery to be the same type as console.log/error
type Logger = unknown;

export const loggerPrefix = {
  info: 'LOGGER INFO',
  error: 'LOGGER ERROR',
  warn: 'LOGGER WARNING',
};

const info = (message: Logger, ...optionalParams: any[]) => {
  console.log(`${loggerPrefix.info} ${message}`, ...optionalParams);
};

const error = (message: Logger, ...optionalParams: any[]) => {
  console.error(`${loggerPrefix.error} ${message}`, ...optionalParams);
};

const warn = (message: Logger, ...optionalParams: any[]) => {
  console.warn(`${loggerPrefix.warn} ${message}`, ...optionalParams);
};

export default { info, error, warn };
