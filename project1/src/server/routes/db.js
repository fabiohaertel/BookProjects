import { Router } from 'express';
import { selectById } from '../db/database.js';

// Database server (data tier). Answers queries from the web tier.
const router = Router();

router.get('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'User id must be a positive integer' });
  }
  res.json(selectById('users', id));
});

export default router;
