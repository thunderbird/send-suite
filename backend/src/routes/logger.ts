import { Router } from 'express';
import logger from '../logger';

const router: Router = Router();

export const loggerPrefix = {
  info: '📳 CLIENT INFO',
  error: '📳 CLIENT ERROR',
  warn: '📳 CLIENT WARNING',
};

export const loggerResponse = 'Logged successfully';

function createLog({ type, message, timestamp }) {
  const commonArgs = {
    logGroup: 'client',
    timestamp,
  };
  switch (type) {
    case 'info':
      logger.info({
        message: `${loggerPrefix.info}: ${message}`,
        ...commonArgs,
      });
      break;
    case 'error':
      logger.error({
        message: `${loggerPrefix.error}: ${message}`,
        ...commonArgs,
      });
      break;
    case 'warn':
      logger.warn({
        message: `${loggerPrefix.warn}: ${message}`,
        ...commonArgs,
      });
      break;
  }
}

router.post('/api/logger', (req, res) => {
  const { type, message, timestamp } = req.body;

  createLog({ type, message, timestamp });

  res.status(200).json({
    message: loggerResponse,
  });
});

export default router;
