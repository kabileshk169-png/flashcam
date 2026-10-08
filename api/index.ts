import express, { Request, Response } from 'express';
import { apiRouter } from '../server/routes.js';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global CORS headers for Vercel Serverless environment
app.use((_req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mount on both /api and root to seamlessly handle all Vercel rewrite patterns
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
