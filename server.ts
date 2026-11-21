/**
 * @file server.ts
 * @description 全栈 Express 入口文件：
 * 开发环境挂载 Vite 中间件（监听 3000 端口），生产环境托管 dist 静态资源，并提供健康检查端点。
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT) || 3000;

/** 健康检查端点 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cas-bio-toolbox' });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CAS Biology Toolbox server listening on http://localhost:${PORT}`);
  });
}

startServer();
