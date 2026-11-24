import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dnsRouter from './routes/dns.js';
import apiRouter from './routes/api.js';
import dbRouter from './routes/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use('/dns', dnsRouter);
  app.use('/api', apiRouter);
  app.use('/db', dbRouter);
  app.use(express.static(PUBLIC_DIR));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
