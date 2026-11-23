/**
 * @file server/vercelApp.ts
 * @description Vercel Serverless Express 适配入口（将通过 esbuild 编译为单文件 api/index.mjs，消除 ESM 相对路径与 TS enum 兼容问题）
 */

import express, { NextFunction, Request, Response } from 'express';
import { createApiRouter } from './api';

export function normalizeVercelApiUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    const vpath = parsed.searchParams.get('__vpath');
    if (vpath !== null) {
      parsed.searchParams.delete('__vpath');
      const cleanSub = vpath.replace(/^\/+/, '');
      const qs = parsed.searchParams.toString();
      return `/api/${cleanSub}${qs ? `?${qs}` : ''}`;
    }
    if (!parsed.pathname.startsWith('/api')) {
      const qs = parsed.searchParams.toString();
      return `/api${parsed.pathname.startsWith('/') ? '' : '/'}${parsed.pathname}${qs ? `?${qs}` : ''}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.url = normalizeVercelApiUrl(req.url);
  next();
});

app.use('/api', createApiRouter());

export default app;
