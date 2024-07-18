import logger from '../logger';

type ErrorRespInfo = {
  statusCode: number;
  message: string;
};

export const AUTH_ERRORS = {
  LOG_IN_FAILED: {
    statusCode: 500,
    message: 'Could not log in.',
  },
  LOG_OUT_FAILED: {
    statusCode: 500,
    message: 'Could not log out.',
  },
  ALLOW_LIST_FAILED: {
    statusCode: 401,
    message: 'Not in allow list.',
  },
};

export const CONTAINER_ERRORS = {
  ACCESS_LINKS_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get access links.',
  },
  CONTAINER_NOT_CREATED: {
    statusCode: 500,
    message: 'Could not create container.',
  },
  CONTAINER_NOT_DELETED: {
    statusCode: 500,
    message: 'Could not delete container.',
  },
  CONTAINER_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not find container.',
  },
  CONTAINER_NOT_RENAMED: {
    statusCode: 500,
    message: 'Could not rename container.',
  },
  INFO_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get container information.',
  },
  ITEM_NOT_CREATED: {
    statusCode: 500,
    message: 'Could not create item.',
  },
  ITEM_NOT_DELETED: {
    statusCode: 500,
    message: 'Could not delete item.',
  },
  ITEM_NOT_RENAMED: {
    statusCode: 500,
    message: 'Could not rename item.',
  },
  INVITATION_NOT_CREATED: {
    statusCode: 500,
    message: 'Could not invite member.',
  },
  INVITATION_NOT_DELETED: {
    statusCode: 500,
    message: 'Could not remove invitation.',
  },
  MEMBER_NOT_CREATED: {
    statusCode: 500,
    message: 'Could not add group member.',
  },
  MEMBER_NOT_DELETED: {
    statusCode: 500,
    message: 'Could not remove group member.',
  },
  MEMBERS_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get members.',
  },
  PERMISSIONS_NOT_UPDATED: {
    statusCode: 500,
    message: 'Could not update permissions.',
  },
  SHARES_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get shares for container.',
  },
};

export const DOWNLOAD_ERRORS = {
  DOWNLOAD_FAILED: {
    statusCode: 500,
    message: 'Could not download file.',
  },
};

export const SHARING_ERRORS = {
  ACCESS_LINK_NOT_ACCEPTED: {
    statusCode: 500,
    message: 'Could not accept access link.',
  },
  ACCESS_LINK_NOT_CREATED: {
    statusCode: 500,
    message: 'Could not create access link.',
  },
  ACCESS_LINK_NOT_DELETED: {
    statusCode: 500,
    message: 'Could not delete access link.',
  },
  ACCESS_LINK_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not find access link.',
  },
  CHALLENGE_FAILED: {
    statusCode: 403,
    message: 'Failed access link challenge.',
  },
  CHALLENGE_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get access link challenge.',
  },
  CONTAINER_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not find container for access link.',
  },
  NOT_BURNED: {
    statusCode: 500,
    message: 'Could not burn container.',
  },
};

export const TAG_ERRORS = {
  NOT_CREATED: {
    statusCode: 500,
    message: 'Could not create tag.',
  },
  NOT_DELETED: {
    statusCode: 500,
    message: 'Could not delete tag.',
  },
  NOT_FOUND: {
    statusCode: 404,
    message: 'Could not find tag.',
  },
  NOT_RENAMED: {
    statusCode: 500,
    message: 'Could not rename tag.',
  },
};

export const UPLOAD_ERRORS = {
  FILE_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get file.',
  },
  NOT_CREATED: {
    statusCode: 500,
    message: 'Could not upload file.',
  },
};

export const USER_ERRORS = {
  BACKUP_FAILED: {
    statusCode: 500,
    message: 'Could not make backup.',
  },
  BACKUP_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not retrieve backup.',
  },
  DEV_LOGIN_FAILED: {
    statusCode: 500,
    message: 'Could not perform dev-only login.',
  },
  HISTORY_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get user history.',
  },
  INVITATIONS_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get user invitations.',
  },
  FOLDERS_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get user folders.',
  },
  PROFILE_NOT_UPDATED: {
    statusCode: 500,
    message: 'Could not update user profile.',
  },
  PUBLIC_KEY_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get public key.',
  },
  RECEIVED_FOLDERS_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get received folders.',
  },
  SHARED_FOLDERS_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not get shared folders.',
  },
  SESSION_NOT_FOUND: {
    statusCode: 500,
    message: 'Could not get user session.',
  },
  USER_NOT_CREATED: {
    statusCode: 500,
    message: 'Could not create user.',
  },
  USER_NOT_FOUND: {
    statusCode: 404,
    message: 'Could not find user.',
  },
};

// Identifies the request variables used by the middleware in this file.
const REQ_VAR_STATUS_CODE = 'REQ_VAR_STATUS_CODE';
const REQ_VAR_USER_MESSAGE = 'REQ_VAR_USER_MESSAGE';

// Returns a middleware function that adds error information to the request object
export function addErrorHandling(err: ErrorRespInfo) {
  const { statusCode, message } = err;
  return (req, res, next) => {
    req[REQ_VAR_STATUS_CODE] = statusCode;
    req[REQ_VAR_USER_MESSAGE] = message;
    next();
  };
}

/**
 * Accepts an async route handler.
 * Any errors thrown will be passed to the global error handler middleware.
 */
export function wrapAsyncHandler(fn) {
  return function (req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Global error handler middleware.
// Uses the error status code and message
// if added by `onError`.
// Falls back to a generic status 500 and the
// message from the `err` object.
export function errorHandler(err, req, res) {
  const status = req[REQ_VAR_STATUS_CODE] ?? 500;
  const message =
    req[REQ_VAR_USER_MESSAGE] ?? err.message ?? 'Internal Server Error';

  res.status(status).json({
    status: 'error',
    statusCode: status,
    message: message,
  });

  logger.error(
    `${status} - ${req.method} ${req.originalUrl} - ${req.ip} - ${message} `
  );
}
