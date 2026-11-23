/**
 * @file api/index.ts
 * @description Vercel Serverless API 入口（挂载全部服务端数据与四区间/三级图谱算法路由）
 */

import express from 'express';
import { createApiRouter } from '../server/api';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use('/api', createApiRouter());

export default app;
