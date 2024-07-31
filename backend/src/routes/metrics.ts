import { Router } from 'express';
import { useMetrics } from '../metrics';
import { getHashedEmail } from '../utils/session';

const router: Router = Router();

router.post('/api/metrics/page-load', (req, res) => {
  const data = req.body;
  const uid = getHashedEmail(req);

  const metrics = useMetrics();

  const anon_id = [req.hostname, data.browser_version, data.os_version].join(
    '-'
  );

  const event = 'page-load';
  const properties = {
    ...data,
    service: 'send',
  };

  if (uid) {
    metrics.capture({
      distinctId: uid,
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

  console.log(anon_id);

  res.status(200).json({
    message: uid || anon_id,
  });
});

export default router;
