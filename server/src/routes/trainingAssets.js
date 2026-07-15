import { Router } from 'express';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();
const DEFAULT_BASE_URL = 'https://api.pexels.com/v1';
const MAX_QUERY_LENGTH = 100;
const cache = new Map();

function getNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizePhoto(photo) {
  return {
    id: photo.id,
    alt: typeof photo.alt === 'string' ? photo.alt : '',
    photographer: typeof photo.photographer === 'string' ? photo.photographer : '',
    photographerUrl: typeof photo.photographer_url === 'string' ? photo.photographer_url : '',
    width: photo.width,
    height: photo.height,
    src: {
      small: photo.src?.small || '',
      medium: photo.src?.medium || '',
      large: photo.src?.large || '',
      original: photo.src?.original || '',
    },
  };
}

router.get('/search', async (req, res, next) => {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    if (!query || query.length > MAX_QUERY_LENGTH) {
      throw new ApiError('TRAINING_ASSETS_VALIDATION_ERROR', `query 必须为 1-${MAX_QUERY_LENGTH} 个字符`, 400);
    }

    const page = getNumber(req.query.page, 1, 1, 1000);
    const perPage = getNumber(req.query.per_page, 12, 1, 80);
    const cacheKey = `${query.toLowerCase()}|${page}|${perPage}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);

    const apiKey = String(process.env.PEXELS_API_KEY || '').trim();
    if (!apiKey) {
      throw new ApiError('TRAINING_ASSETS_CONFIG_ERROR', 'Pexels API Key 未配置，请在 server/.env 设置 PEXELS_API_KEY', 503);
    }

    const baseUrl = String(process.env.PEXELS_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
    const url = new URL(`${baseUrl}/search`);
    url.searchParams.set('query', query);
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));

    const timeoutMs = getNumber(process.env.PEXELS_TIMEOUT_MS, 10000, 1000, 30000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(url, { headers: { Authorization: apiKey }, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = response.status === 401 ? 'Pexels API Key 无效或已过期' : `Pexels 请求失败（HTTP ${response.status}）`;
      throw new ApiError('TRAINING_ASSETS_PROVIDER_ERROR', detail, response.status >= 500 ? 502 : 401);
    }

    const data = await response.json();
    const value = {
      status: 'success',
      provider: 'pexels',
      photos: Array.isArray(data.photos) ? data.photos.map(normalizePhoto) : [],
      pagination: {
        page: data.page || page,
        perPage: data.per_page || perPage,
        totalResults: data.total_results || 0,
        nextPage: data.next_page || null,
      },
      attribution: '图片来自 Pexels',
    };
    cache.set(cacheKey, { value, expiresAt: Date.now() + 5 * 60 * 1000 });
    return res.json(value);
  } catch (error) {
    if (error.name === 'AbortError') {
      return next(new ApiError('TRAINING_ASSETS_TIMEOUT', '图库请求超时，请稍后重试', 504));
    }
    return next(error);
  }
});

export default router;
