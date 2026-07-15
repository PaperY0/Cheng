// POST /api/training/score - 维度打分训练 AI 评分接口
//
// 请求格式：JSON
// {
//   "questionId": "score-layout-001",
//   "dimension": "layout",
//   "scores": { "layout": 7, "color": 8, "typography": 6, "whitespace": 7 },
//   "image": { "url": "data:image/svg+xml,..." },
//   "clientId": "client-xxxxx"
// }
//
// 成功响应（AI）：
// {
//   "status": "success",
//   "aiScores": { "layout": 7, "color": 6, "typography": 8, "whitespace": 7 },
//   "overallComment": "...",
//   "strengths": ["..."],
//   "improvements": ["..."],
//   "confidence": 0.86,
//   "provider": "qwen-vl"
// }
//
// 降级响应（AI 不可用/失败/超时/超额）：
// {
//   "status": "success",
//   "aiScores": { ... 本地兜底分数 ... },
//   "overallComment": "...",
//   "strengths": ["..."],
//   "improvements": ["..."],
//   "confidence": 0,
//   "provider": "local",
//   "fallback": true,
//   "fallbackReason": "disabled|no_api_key|daily_limit_exceeded|timeout|provider_error|output_invalid|network_error"
// }
//
// 设计原则：
// - AI 只看图片独立评分，不接收用户分数或本地标准答案
// - AI 评分仅作参考，不覆盖用户判断
// - AI 失败时返回明确的本地兜底结果
// - 不允许在失败时反复自动重试
// - 每个用户每天最多 AI 评分 TRAINING_AI_DAILY_LIMIT 次（默认 20）

import { Router } from 'express';
import { ApiError } from '../middleware/errorHandler.js';
import { scoreDesignWithQwenVL } from '../providers/trainingScore.js';

const router = Router();

const MAX_FIELD_LENGTH = {
  questionId: 100,
  dimension: 50,
  clientId: 100,
};

const ALLOWED_DIMENSIONS = ['layout', 'color', 'typography', 'whitespace'];
const ALLOWED_PROVIDERS = ['none', 'qwen-vl'];

// questionId 格式：score-{dimension}-NNN
const QUESTION_ID_PATTERN = /^score-(layout|color|typography|whitespace)-\d{3}$/;

// 图片 data URL 最大长度（约 512KB base64）
const MAX_IMAGE_LENGTH = 700000;

// 每日限额：按 clientId + 日期 统计
const dailyCountMap = new Map();

function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDailyCount(clientId) {
  const key = `${clientId}:${getTodayStr()}`;
  return dailyCountMap.get(key) || 0;
}

function incrementDailyCount(clientId) {
  const key = `${clientId}:${getTodayStr()}`;
  const current = dailyCountMap.get(key) || 0;
  dailyCountMap.set(key, current + 1);
  return current + 1;
}

function getDailyLimit() {
  const limit = Number(process.env.TRAINING_AI_DAILY_LIMIT);
  return Number.isFinite(limit) && limit > 0 ? limit : 20;
}

/**
 * 构建本地兜底评分（AI 不可用时使用）
 * 返回中性评分与提示，不伪造 AI 判断
 */
function buildLocalFallback() {
  return {
    aiScores: { layout: 6, color: 6, typography: 6, whitespace: 6 },
    overallComment: 'AI 评分暂不可用，以下为中性参考分数，请以你自己的判断为准。',
    strengths: ['AI 暂未返回，请自行观察设计亮点'],
    improvements: ['AI 暂未返回，请自行观察可改进之处'],
    confidence: 0,
  };
}

function sendFallback(res, reason) {
  const data = buildLocalFallback();
  return res.json({
    status: 'success',
    ...data,
    provider: 'local',
    fallback: true,
    fallbackReason: reason,
  });
}

/**
 * 校验请求字段
 */
function validateFields(body) {
  const errors = {};

  // questionId
  if (!body.questionId || typeof body.questionId !== 'string' || !body.questionId.trim()) {
    errors.questionId = 'questionId 为必填项';
  } else if (body.questionId.length > MAX_FIELD_LENGTH.questionId) {
    errors.questionId = `questionId 不能超过 ${MAX_FIELD_LENGTH.questionId} 字`;
  } else if (!QUESTION_ID_PATTERN.test(body.questionId)) {
    errors.questionId = 'questionId 格式非法，应为 score-{dimension}-NNN';
  }

  // dimension
  if (!body.dimension || !ALLOWED_DIMENSIONS.includes(body.dimension)) {
    errors.dimension = `dimension 必须是 ${ALLOWED_DIMENSIONS.join('、')} 之一`;
  }

  // scores：四个维度都必须是 1-10 整数
  const scores = body.scores;
  if (!scores || typeof scores !== 'object') {
    errors.scores = 'scores 为必填项';
  } else {
    for (const dim of ALLOWED_DIMENSIONS) {
      const v = scores[dim];
      if (typeof v !== 'number' || v < 1 || v > 10 || !Number.isInteger(v)) {
        errors[`scores.${dim}`] = `${dim} 必须是 1-10 的整数`;
      }
    }
  }

  // image：必须包含合法 url
  const image = body.image;
  if (!image || typeof image !== 'object') {
    errors.image = 'image 为必填项';
  } else if (typeof image.url !== 'string' || !(/^(https:\/\/|data:image\/)/i.test(image.url))) {
    errors.image = 'image.url 必须是 HTTPS 或 data:image URL';
  } else if (image.url.length > MAX_IMAGE_LENGTH) {
    errors.image = `图片过大，请压缩到 ${Math.round(MAX_IMAGE_LENGTH / 1024)}KB 以下`;
  }

  // clientId：可选
  if (body.clientId !== undefined && body.clientId !== null && body.clientId !== '') {
    if (typeof body.clientId !== 'string') {
      errors.clientId = 'clientId 必须是字符串';
    } else if (body.clientId.length > MAX_FIELD_LENGTH.clientId) {
      errors.clientId = `clientId 不能超过 ${MAX_FIELD_LENGTH.clientId} 字`;
    }
  }

  return errors;
}

// POST /api/training/score
router.post('/', async (req, res, next) => {
  const routeStart = Date.now();
  try {
    const body = req.body || {};

    // 字段校验
    const errors = validateFields(body);
    if (Object.keys(errors).length > 0) {
      throw new ApiError('TRAINING_SCORE_VALIDATION_ERROR', '请求参数校验失败', 400, errors);
    }

    const { questionId, dimension, scores, image } = body;
    const clientId = (typeof body.clientId === 'string' && body.clientId.trim()) || 'anonymous';

    // 读取 provider 配置（默认 none）
    const providerSwitch = String(process.env.TRAINING_AI_PROVIDER || 'none').trim().toLowerCase();
    if (!ALLOWED_PROVIDERS.includes(providerSwitch)) {
      console.log('[training-score] 未知 provider，返回本地兜底', { questionId, providerSwitch });
      return sendFallback(res, 'disabled');
    }

    // none 模式：完全不调用 AI
    if (providerSwitch === 'none') {
      return sendFallback(res, 'disabled');
    }

    // 每日限额检查
    const dailyLimit = getDailyLimit();
    const currentCount = getDailyCount(clientId);
    if (currentCount >= dailyLimit) {
      console.log('[training-score] 超过每日额度，返回本地兜底', { questionId, clientId, currentCount, dailyLimit });
      return sendFallback(res, 'daily_limit_exceeded');
    }

    // API Key 检查
    const apiKey = String(process.env.DASHSCOPE_API_KEY || '').trim();
    if (!apiKey) {
      console.log('[training-score] API Key 缺失，返回本地兜底', { questionId });
      return sendFallback(res, 'no_api_key');
    }

    // 消耗一次额度（无论后续成功或失败）
    const newCount = incrementDailyCount(clientId);

    // 调用 AI 评分（只发送图片，不发送用户分数或标准答案）
    try {
      const result = await scoreDesignWithQwenVL({ imageUrl: image.url });

      const elapsed = Date.now() - routeStart;
      console.log('[training-score] AI 评分成功', { questionId, elapsed, dailyCount: newCount });

      return res.json({
        status: 'success',
        ...result,
        provider: 'qwen-vl',
      });
    } catch (aiError) {
      // AI 失败：降级返回本地兜底
      let reason = 'provider_error';
      if (aiError.code === 'TRAINING_SCORE_TIMEOUT') reason = 'timeout';
      else if (aiError.code === 'TRAINING_SCORE_OUTPUT_INVALID') reason = 'output_invalid';
      else if (aiError.code === 'TRAINING_SCORE_CONFIG_ERROR') reason = 'no_api_key';
      else if (aiError.code === 'TRAINING_SCORE_AUTH_ERROR') reason = 'invalid_api_key';

      const elapsed = Date.now() - routeStart;
      console.log('[training-score] AI 评分失败，降级本地兜底', {
        questionId,
        elapsed,
        reason,
        dailyCount: newCount,
        error: aiError.message || String(aiError),
      });
      return sendFallback(res, reason);
    }
  } catch (err) {
    return next(err);
  }
});

export default router;
