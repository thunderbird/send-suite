import logger from '@/logger';
import { Router } from 'express';

const router: Router = Router();

const loggerPrefix = {
  info: '📳 CLIENT INFO',
  error: '📳 CLIENT ERROR',
};

router.post('/api/logger', (req, res) => {
  const { type, message } = req.body;

  switch (type) {
    case 'info':
      logger.info(`${loggerPrefix.info}: ${message}`);
      break;
    case 'error':
      logger.error(`${loggerPrefix.error}: ${message}`);
      break;
  }

  res.status(200).json({
    message: 'Logged successfully',
  });
});

export default router;
