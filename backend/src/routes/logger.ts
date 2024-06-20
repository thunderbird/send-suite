import { Router } from 'express';
import logger from '../logger';

const router: Router = Router();

router.post('/api/logger', (req, res) => {
  logger.info(`📳 CLIENT: ${req.body.message}`);
  res.status(200).json({
    message: 'Logged successfully',
  });
});

export default router;
