import { Router } from 'express';
import { useMetrics } from '../metrics';
import { getuniqueHash, getUniqueHashFromAnonId } from '../utils/session';

const router: Router = Router();

router.post('/api/metrics/page-load', (req, res) => {
  const data = req.body;
  const uniqueHash = getuniqueHash(req);

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
