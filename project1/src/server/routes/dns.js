import { Router } from 'express';

// Simulated DNS table. In the book's single-server setup, DNS is a paid
// third-party service, not hosted by us — this just mimics its answer.
export const DNS_RECORDS = Object.freeze({
  'www.mysite.com': '15.125.23.214',
  'api.mysite.com': '15.125.23.214',
});

const router = Router();

router.get('/resolve', (req, res) => {
  const host = String(req.query.host ?? '').trim().toLowerCase();
  if (!host) {
    return res.status(400).json({ error: 'Query parameter "host" is required' });
  }
  const ip = DNS_RECORDS[host];
  if (!ip) {
    return res.status(404).json({ error: `Host "${host}" not found` });
  }
  res.json({ host, ip });
});

export default router;
