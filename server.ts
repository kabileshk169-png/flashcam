import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes.js';
import { mongoManager } from './server/mongodb.js';
import { gridfsRouter } from './server/gridfs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prevent abrupt server exits on socket disconnects or unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('[FLASH CAM] Handled uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FLASH CAM] Handled unhandled rejection:', reason);
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize MongoDB Atlas connection asynchronously
  mongoManager.connect().catch((err) => {
    console.warn('[FLASH CAM] MongoDB Atlas initialization notice:', err?.message);
  });

  // Mount GridFS and streaming routes
  app.use('/api/gridfs', gridfsRouter);

  // Static uploads directory for recorded and uploaded videos & frames
  const uploadsDir = path.resolve(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Mount API router
  app.use('/api', apiRouter);

  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FLASH CAM] Surveillance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FLASH CAM] Startup error:', err);
  process.exit(1);
});
