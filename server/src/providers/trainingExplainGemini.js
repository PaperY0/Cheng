// 审美训练 AI 解析 Provider - Gemini 骨架
// 暂时只建立接口，不默认启用
// 启用方式：在 server/.env 中设置 TRAINING_AI_PROVIDER=gemini
//
// 设计原则与 qwen-vl provider 一致：
// - 不发送图片，只发送题目和答案文本
// - AI 只负责生成额外解释，不负责计分
// - API Key 只读取服务端环境变量，禁止返回给前端
// - AI 失败时由路由层降级返回本地解析

import { ApiError } from '../middleware/errorHandler.js';

// 复用 qwen-vl provider 的错误码
export const GEMINI_ERRORS = {
  CONFIG_ERROR: 'TRAINING_EXPLAIN_CONFIG_ERROR',
  PROVIDER_ERROR: 'TRAINING_EXPLAIN_PROVIDER_ERROR',
  OUTPUT_INVALID: 'TRAINING_EXPLAIN_OUTPUT_INVALID',
  TIMEOUT: 'TRAINING_EXPLAIN_TIMEOUT',
  NOT_IMPLEMENTED: 'GEMINI_NOT_IMPLEMENTED',
};

/**
 * 调用 Gemini 生成训练题目的额外解析
 *
 * 当前状态：未实现，调用时直接抛出 NOT_IMPLEMENTED 错误
 * 路由层捕获后会降级返回本地解析
 *
 * 后续实现时需要：
 * 1. 读取 GEMINI_API_KEY 环境变量
 * 2. 调用 Gemini API（generativelanguage.googleapis.com）
 * 3. 解析响应并校验 4 字段结构
 * 4. 使用 AbortController 控制超时
 *
 * @param {Object} params - 同 explainTrainingQuestion
 * @returns {Promise<Object>} { observation, principle, suggestion, memoryTip }
 */
export async function explainTrainingQuestionWithGemini({ question, principle, userAnswer, correctAnswer, baseExplanation }) {
  // 防御性校验：入参完整性
  if (!question || !principle || !userAnswer || !correctAnswer || !baseExplanation) {
    throw new ApiError(GEMINI_ERRORS.PROVIDER_ERROR, 'Gemini provider 入参缺失', 400);
  }

  // 当前未实现，直接抛出错误，路由层会降级为本地解析
  console.log('[training-explain-gemini] 未实现，降级本地解析');
  throw new ApiError(
    GEMINI_ERRORS.NOT_IMPLEMENTED,
    'Gemini provider 暂未实现，请使用 qwen-vl 或保持 none 模式',
    501
  );
}
