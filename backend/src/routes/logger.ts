import logger from '@/logger';
import { Router } from 'express';

const router: Router = Router();

router.post('/api/logger', (req, res) => {
  const { type, message } = req.body;

  switch (type) {
    case 'info':
      logger.info(`📳 CLIENT INFO: ${message}`);
      break;
    case 'error':
      logger.error(`📳 CLIENT ERROR: ${message}`);
      break;
  }

  res.status(200).json({
    message: 'Logged successfully',
  });
});

export default router;
