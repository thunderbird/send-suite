import logger from '../logger';
/**
 * Accepts an async route handler.
 * Any errors thrown will be passed to Express.
 */
export function asyncHandler(fn) {
  return function (req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 *
 */
export class CustomError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;

    // Restore the prototype chain per
    // https://www.typescriptlang.org/docs/handbook/2/classes.html#extends-clauses
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// Defined the middleware function
export function errorHandler(err, req, res, next) {
  // Define error details
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send the response
  res.status(status).json({
    status: 'error',
    statusCode: status,
    message: message,
  });

  logger.error(
    `${status} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
}
