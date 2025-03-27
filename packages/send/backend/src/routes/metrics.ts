import {
  getDataFromAuthenticatedRequest,
  getJWTfromToken,
} from '@/auth/client';
import { Router } from 'express';
import { useMetrics } from '../metrics';
import { getUniqueHashFromAnonId } from '../utils/session';

const router: Router = Router();

router.post('/api/metrics/page-load', (req, res) => {
  let uniqueHash = null;
  try {
    getJWTfromToken(req.headers.authorization);
    const dataFromToken = getDataFromAuthenticatedRequest(req);
    uniqueHash = dataFromToken.uniqueHash;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // will use anon_id
  }

  const data = req.body;

  const metrics = useMetrics();

  let anon_id = [req.hostname, data.browser_version, data.os_version].join('-');

  anon_id = getUniqueHashFromAnonId(anon_id);

  const event = 'page-load';
  const properties = {
    ...data,
    service: 'send',
  };

  if (uniqueHash) {
    metrics.capture({
      distinctId: uniqueHash,
      event,
      properties,
    });
  } else {
    metrics.capture({
      distinctId: anon_id,
      event,
      properties,
    });
  }

  res.status(200).json({
    message: uniqueHash || anon_id,
  });
});

export default router;
