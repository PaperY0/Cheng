import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRouter from './routes/health.js';
import diagnoseRouter from './routes/diagnose.js';
import generatePreviewRouter from './routes/generatePreview.js';
import trainingExplainRouter from './routes/trainingExplain.js';
import trainingScoreRouter from './routes/trainingScore.js';
import trainingAssetsRouter from './routes/trainingAssets.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// 始终从 server/.env 加载配置，避免从项目根目录启动时读不到密钥。
const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(serverDir, '../.env') });

const app = express();

// 生产环境由同一个 Express 进程托管前端构建产物，确保浏览器访问同一域名时
// /api 请求和 SPA 路由都能正常工作。开发环境仍由 Vite 负责前端热更新。
const projectRoot = path.resolve(serverDir, '../../');
const frontendDist = path.join(projectRoot, 'web', 'dist');

// 允许的来源。生产前端由当前 Express 同域托管，但浏览器 fetch 仍会携带
// Origin，因此必须把公开站点加入白名单；否则同域的 /api 请求也会被 CORS
// 中间件误拦截。部署到其他域名时可用 ALLOWED_ORIGINS 覆盖或追加。
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://cheng-jing.onrender.com',
].join(',');

const configuredAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = `${defaultAllowedOrigins},${configuredAllowedOrigins}`
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// CORS：只允许本地开发地址
app.use(
  cors({
    origin(origin, cb) {
      // 允许同源请求和无 origin 的工具请求（curl / Postman）
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS 不允许的来源: ${origin}`));
      }
    },
  })
);

// JSON 请求体大小限制，避免无限制接收数据
app.use(express.json({ limit: process.env.BODY_LIMIT || '1mb' }));

// 路由
app.use('/api/health', healthRouter);
app.use('/api/diagnose', diagnoseRouter);
app.use('/api/generate-preview', generatePreviewRouter);
app.use('/api/training/explain', trainingExplainRouter);
app.use('/api/training/score', trainingScoreRouter);
app.use('/api/training/assets', trainingAssetsRouter);

// 仅在前端已构建时启用静态托管；未构建时不影响纯 API 开发模式。
app.use(express.static(frontendDist));

// Vite SPA fallback：动态前端路由刷新时返回 index.html。
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) next(error);
  });
});

// 404
app.use(notFoundHandler);

// 统一错误处理
app.use(errorHandler);

export default app;
