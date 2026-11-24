import { Router } from 'express';
import { findUserById } from '../db/database.js';

// Web server (web tier). Reads its data from the data tier.
const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/users/:id', (req, res) => {
  const user = findUserById(Number(req.params.id));
  if (!user) {
    return res.status(404).json({ error: `User ${req.params.id} not found` });
  }
  res.json(user);
});

export default router;
