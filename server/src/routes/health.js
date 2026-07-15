import { Router } from 'express';
import { getImageServiceStatus } from '../providers/qwenImage.js';

const router = Router();

// GET /api/health - 服务端健康检查
router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'diagnosis-api',
    imageService: getImageServiceStatus(),
  });
});

export default router;
