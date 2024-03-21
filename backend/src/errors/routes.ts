import logger from '../logger';
/**
 * Accepts an async route handler.
 * Any errors thrown will be passed to the global error handler middleware.
 */
export function asyncHandler(fn) {
  return function (req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const ERROR_STATUS_CODE = 'ERROR_STATUS_CODE';
const ERROR_USER_MESSAGE = 'ERROR_USER_MESSAGE';

// Returns a middleware function that adds error information to the request object
export function onError(statusCode: number, message: string) {
  return (req, res, next) => {
    req[ERROR_STATUS_CODE] = statusCode;
    req[ERROR_USER_MESSAGE] = message;
    next();
  };
}

// Global error handler middleware
export function errorHandler(err, req, res, next) {
  // Get the error information from the request,
  // Falling back to the values from the ErrorObj
  const status = req[ERROR_STATUS_CODE] ?? 500;
  const message = req[ERROR_USER_MESSAGE] ?? 'Internal Server Error';

  res.status(status).json({
    status: 'error',
    statusCode: status,
    message: message,
  });

  logger.error(
    `${status} - ${req.method} ${req.originalUrl} - ${req.ip} - ${message} `
  );
}
