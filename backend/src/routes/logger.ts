import logger from '@/logger';
import { Router } from 'express';

const router: Router = Router();

export const loggerPrefix = {
  info: '📳 CLIENT INFO',
  error: '📳 CLIENT ERROR',
  warn: '📳 CLIENT WARNING',
};

export const loggerResponse = 'Logged successfully';

router.post('/api/logger', (req, res) => {
  const { type, message } = req.body;

  switch (type) {
    case 'info':
      logger.info(`${loggerPrefix.info}: ${message}`);
      break;
    case 'error':
      logger.error(`${loggerPrefix.error}: ${message}`);
      break;
    case 'warn':
      logger.warn(`${loggerPrefix.warn}: ${message}`);
      break;
  }

  res.status(200).json({
    message: loggerResponse,
  });
});

export default router;
