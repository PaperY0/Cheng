// POST /api/training/explain - 训练题目 AI 解析接口
//
// 请求格式：JSON
// {
//   "questionId": "contrast-001",
//   "dimension": "contrast",
//   "userAnswer": "b",
//   "question": "下面哪一张设计图的信息层级更清晰？",
//   "principle": "对比",
//   "images": [{"label":"A","url":"https://..."},{"label":"B","url":"https://..."}],
//   "clientId": "client-xxxxx"  // 可选，用于每日限额统计
// }
//
// 成功响应（AI）：
// {
//   "status": "success",
//   "explanation": { "observation", "principle", "suggestion", "memoryTip" },
//   "provider": "qwen-vl" | "gemini"
// }
//
// 降级响应（AI 不可用/失败/超时/重复请求/超额）：
// {
//   "status": "success",
//   "explanation": { ... 本地解析 ... },
//   "provider": "local",
//   "fallback": true,
//   "fallbackReason": "disabled|no_api_key|duplicate|daily_limit_exceeded|timeout|provider_error|output_invalid|network_error|not_implemented"
// }
//
// 设计原则：
// - AI 独立比较 A/B 图片并返回判断，不负责替代题库计分
// - 不向 AI 发送题库正确答案或本地解析
// - AI 任何失败都降级返回本地解析，不影响训练
// - 单个题目在进程生命周期内只允许请求一次 AI
// - 每个用户每天最多 AI 解析 TRAINING_AI_DAILY_LIMIT 次（默认 20）
// - 超过额度后自动使用本地解析
// - 不允许在失败时反复自动重试

import { Router } from 'express';
import { ApiError } from '../middleware/errorHandler.js';
import { explainTrainingQuestion } from '../providers/trainingExplain.js';
import { explainTrainingQuestionWithGemini } from '../providers/trainingExplainGemini.js';

const router = Router();

// 字段最大长度限制（防止超长请求体）
const MAX_FIELD_LENGTH = {
  questionId: 100,
  dimension: 50,
  userAnswer: 50,
  question: 500,
  principle: 50,
  clientId: 100,
};

// 允许的维度
const ALLOWED_DIMENSIONS = ['contrast', 'alignment', 'repetition', 'proximity'];

// 允许的 provider
const ALLOWED_PROVIDERS = ['none', 'qwen-vl', 'gemini'];

// questionId 格式校验：小写字母 + 连字符 + 数字（如 contrast-001）
const QUESTION_ID_PATTERN = /^[a-z]+-\d+$/;

// 单题去重：同一 questionId 在进程生命周期内只允许请求一次 AI
// 题库只有 12 道题，Set 最多 12 个元素，无需清理
const requestedQuestions = new Set();

// 每日限额：按 clientId + 日期 统计
// 结构：Map<`${clientId}:${dateStr}`, number>
// 进程重启后清零（开发环境可接受）
const dailyCountMap = new Map();

// 获取今日日期字符串（YYYY-MM-DD，本地时区）
function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 获取或创建今日计数
function getDailyCount(clientId) {
  const key = `${clientId}:${getTodayStr()}`;
  return dailyCountMap.get(key) || 0;
}

// 增加今日计数
function incrementDailyCount(clientId) {
  const key = `${clientId}:${getTodayStr()}`;
  const current = dailyCountMap.get(key) || 0;
  dailyCountMap.set(key, current + 1);
  return current + 1;
}

// 获取每日限额
function getDailyLimit() {
  const limit = Number(process.env.TRAINING_AI_DAILY_LIMIT);
  return Number.isFinite(limit) && limit > 0 ? limit : 20;
}

/**
 * 构建本地降级解析（当 AI 不可用时使用）
 * AI 不可用时提供不依赖模型的本地提示
 */
function buildLocalExplanation({ principle, userAnswer, correctAnswer }) {
  const fallbackText = '请对照两张图片，观察信息层级、间距、对齐关系和视觉一致性。';
  const isCorrect = userAnswer === correctAnswer;
  return {
    bestOption: null,
    confidence: null,
    observation: isCorrect
      ? `你的选择是正确的。${fallbackText}`
      : `你选择了 ${String(userAnswer).toUpperCase()}，题库标准答案为 ${String(correctAnswer).toUpperCase()}。${fallbackText}`,
    principle: `${principle}原则：请参考本题解析中的设计原则说明。`,
    suggestion: fallbackText,
    memoryTip: '建议回顾本题的设计原则说明，加深理解。',
  };
}

/**
 * 返回降级响应（HTTP 200，provider 为 local）
 */
function sendFallback(res, params, reason) {
  const explanation = buildLocalExplanation(params);
  return res.json({
    status: 'success',
    explanation,
    provider: 'local',
    fallback: true,
    fallbackReason: reason,
  });
}

/**
 * 校验请求字段
 * @returns {Object} errors 对象，空对象表示校验通过
 */
function validateFields(body) {
  const errors = {};

  // questionId：非空字符串 + 格式校验
  if (!body.questionId || typeof body.questionId !== 'string' || !body.questionId.trim()) {
    errors.questionId = 'questionId 为必填项';
  } else if (body.questionId.length > MAX_FIELD_LENGTH.questionId) {
    errors.questionId = `questionId 不能超过 ${MAX_FIELD_LENGTH.questionId} 字`;
  } else if (!QUESTION_ID_PATTERN.test(body.questionId)) {
    errors.questionId = 'questionId 格式非法，应为 {dimension}-{number} 格式';
  }

  // dimension：非空且在允许列表中
  if (!body.dimension || !ALLOWED_DIMENSIONS.includes(body.dimension)) {
    errors.dimension = `dimension 必须是 ${ALLOWED_DIMENSIONS.join('、')} 之一`;
  }

  // userAnswer：非空字符串
  if (!body.userAnswer || typeof body.userAnswer !== 'string' || !body.userAnswer.trim()) {
    errors.userAnswer = 'userAnswer 为必填项';
  } else if (body.userAnswer.length > MAX_FIELD_LENGTH.userAnswer) {
    errors.userAnswer = `userAnswer 不能超过 ${MAX_FIELD_LENGTH.userAnswer} 字`;
  }

  // question：非空字符串
  if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
    errors.question = 'question 为必填项';
  } else if (body.question.length > MAX_FIELD_LENGTH.question) {
    errors.question = `question 不能超过 ${MAX_FIELD_LENGTH.question} 字`;
  }

  // principle：非空字符串
  if (!body.principle || typeof body.principle !== 'string' || !body.principle.trim()) {
    errors.principle = 'principle 为必填项';
  } else if (body.principle.length > MAX_FIELD_LENGTH.principle) {
    errors.principle = `principle 不能超过 ${MAX_FIELD_LENGTH.principle} 字`;
  }

  if (!Array.isArray(body.images) || body.images.length !== 2) {
    errors.images = 'images 必须包含恰好 2 张图片';
  } else {
    body.images.forEach((image, index) => {
      if (!image || !['A', 'B'].includes(image.label) || typeof image.url !== 'string' || !(/^(https:\/\/|data:image\/)/i.test(image.url))) {
        errors[`images[${index}]`] = '图片必须包含 A/B 标签和 HTTPS 或 data:image URL';
      }
    });
  }

  // clientId：可选，但必须为字符串且长度合理
  if (body.clientId !== undefined && body.clientId !== null && body.clientId !== '') {
    if (typeof body.clientId !== 'string') {
      errors.clientId = 'clientId 必须是字符串';
    } else if (body.clientId.length > MAX_FIELD_LENGTH.clientId) {
      errors.clientId = `clientId 不能超过 ${MAX_FIELD_LENGTH.clientId} 字`;
    }
  }

  return errors;
}

// POST /api/training/explain
router.post('/', async (req, res, next) => {
  const routeStart = Date.now();
  try {
    const body = req.body || {};

    // 字段校验
    const errors = validateFields(body);
    if (Object.keys(errors).length > 0) {
      throw new ApiError('TRAINING_EXPLAIN_VALIDATION_ERROR', '请求参数校验失败', 400, errors);
    }

    const { questionId, dimension, userAnswer, question, principle, images } = body;
    const correctAnswer = body.correctAnswer || 'unknown';
    // clientId 用于每日限额统计，缺失时归入 anonymous 桶
    const clientId = (typeof body.clientId === 'string' && body.clientId.trim()) || 'anonymous';
    const params = { questionId, dimension, userAnswer, correctAnswer, question, principle };

    // 读取 provider 配置（默认 none，完全不调用 AI）
    const providerSwitch = String(process.env.TRAINING_AI_PROVIDER || 'none').trim().toLowerCase();
    if (!ALLOWED_PROVIDERS.includes(providerSwitch)) {
      console.log('[training-explain] 未知 provider，返回本地解析', { questionId, providerSwitch });
      return sendFallback(res, params, 'disabled');
    }

    // none 模式：完全使用本地解析，不消耗额度
    if (providerSwitch === 'none') {
      return sendFallback(res, params, 'disabled');
    }

    // 单题去重：同一 questionId 只允许请求一次 AI
    // 无论后续成功或失败，都标记为已请求，防止重复消耗额度
    if (requestedQuestions.has(questionId)) {
      console.log('[training-explain] 重复请求，返回本地解析', { questionId });
      return sendFallback(res, params, 'duplicate');
    }

    // 每日限额检查
    const dailyLimit = getDailyLimit();
    const currentCount = getDailyCount(clientId);
    if (currentCount >= dailyLimit) {
      console.log('[training-explain] 超过每日额度，返回本地解析', { questionId, clientId, currentCount, dailyLimit });
      return sendFallback(res, params, 'daily_limit_exceeded');
    }

    // 标记为已请求（防止并发重复）
    requestedQuestions.add(questionId);
    // 消耗一次额度（无论后续成功或失败）
    const newCount = incrementDailyCount(clientId);

    // API Key 检查（qwen-vl 和 gemini 都需要）
    const apiKey = String(process.env.DASHSCOPE_API_KEY || '').trim();
    if (!apiKey && providerSwitch === 'qwen-vl') {
      console.log('[training-explain] API Key 缺失，返回本地解析', { questionId });
      return sendFallback(res, params, 'no_api_key');
    }

    // 调用对应 provider
    try {
      let explanation;
      let providerName;

      if (providerSwitch === 'qwen-vl') {
        explanation = await explainTrainingQuestion({
          question,
          principle,
          userAnswer,
          images,
        });
        providerName = 'qwen-vl';
      } else if (providerSwitch === 'gemini') {
        explanation = await explainTrainingQuestionWithGemini({
          question,
          principle,
          userAnswer,
          images,
        });
        providerName = 'gemini';
      } else {
        // 理论上不会到达，防御性处理
        return sendFallback(res, params, 'disabled');
      }

      const elapsed = Date.now() - routeStart;
      console.log('[training-explain] AI 解析成功', { questionId, provider: providerName, elapsed, dailyCount: newCount });

      return res.json({
        status: 'success',
        explanation,
        provider: providerName,
      });
    } catch (aiError) {
      // AI 失败：降级返回本地解析，不影响训练
      // 不允许反复自动重试：单题去重已标记，前端也不会自动重试
      let reason = 'provider_error';
      if (aiError.code === 'TRAINING_EXPLAIN_TIMEOUT') reason = 'timeout';
      else if (aiError.code === 'TRAINING_EXPLAIN_OUTPUT_INVALID') reason = 'output_invalid';
      else if (aiError.code === 'TRAINING_EXPLAIN_CONFIG_ERROR') reason = 'config_error';
      else if (aiError.code === 'GEMINI_NOT_IMPLEMENTED') reason = 'not_implemented';

      const elapsed = Date.now() - routeStart;
      console.log('[training-explain] AI 解析失败，降级本地解析', {
        questionId,
        provider: providerSwitch,
        elapsed,
        reason,
        dailyCount: newCount,
        error: aiError.message || String(aiError),
      });
      return sendFallback(res, params, reason);
    }
  } catch (err) {
    return next(err);
  }
});

export default router;
