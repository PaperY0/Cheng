// 审美训练 AI 解析 Provider
// 使用 DashScope OpenAI 兼容模式调用文本模型生成额外解析
//
// 设计原则：
// - 不发送图片，第一版只发送题目和答案文本
// - AI 只负责生成额外解释，不负责计分
// - 正确答案来自前端本地题库，AI 不判断对错
// - API Key 只读取服务端 DASHSCOPE_API_KEY，禁止返回给前端
// - AI 失败时由路由层降级返回本地解析

import { ApiError } from '../middleware/errorHandler.js';

// 错误码常量（provider 内部抛 ApiError，路由层统一降级）
export const EXPLAIN_ERRORS = {
  CONFIG_ERROR: 'TRAINING_EXPLAIN_CONFIG_ERROR',
  PROVIDER_ERROR: 'TRAINING_EXPLAIN_PROVIDER_ERROR',
  OUTPUT_INVALID: 'TRAINING_EXPLAIN_OUTPUT_INVALID',
  TIMEOUT: 'TRAINING_EXPLAIN_TIMEOUT',
};

// OpenAI 兼容端点的 chat completions 路径
const CHAT_COMPLETIONS_PATH = '/chat/completions';

// 读取并清理 API Key（仅服务端环境变量，不进响应、不进日志）
function getApiKey() {
  return String(process.env.DASHSCOPE_API_KEY || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

// 获取训练解析专用配置
// 复用 DASHSCOPE_BASE_URL 和 DASHSCOPE_API_KEY，模型可单独配置
function getConfig() {
  const apiKey = getApiKey();
  const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  // 模型优先使用 TRAINING_AI_MODEL，未配置则降级到 DASHSCOPE_MODEL
  const model = process.env.TRAINING_AI_MODEL || process.env.DASHSCOPE_MODEL || 'qwen-plus';
  // 超时统一使用 TRAINING_AI_TIMEOUT_MS
  const timeoutMs = Number(process.env.TRAINING_AI_TIMEOUT_MS) || 15000;
  return { apiKey, baseUrl, model, timeoutMs };
}

// 构建 system prompt，要求模型看图后独立判断
function buildSystemPrompt() {
  return `你是审美训练的视觉评审助手。你必须真正比较用户提供的 A、B 两张图片，独立判断哪一张更符合题目中的设计原则。

严格约束：
1. 只返回合法 JSON，不要包含 markdown 代码块标记、注释或多余文字。
2. JSON 必须恰好包含 6 个字段：bestOption、confidence、observation、principle、suggestion、memoryTip。
3. bestOption 只能是 "A" 或 "B"，代表你独立判断更好的图片；不能读取或猜测题库答案。
4. confidence 必须是 0 到 1 的数字，表示你对独立判断的信心。
5. 每个文本字段都必须是非空字符串。
6. observation：分别指出 A、B 两张图中可观察到的具体视觉事实，不能只复述题目。
7. principle：说明本题对应的设计原则及其核心要求。
8. suggestion：给出具体、可执行的改进或保持建议。
9. memoryTip：用一句话总结记忆口诀。

输出 JSON 结构：
{
  "bestOption": "A 或 B",
  "confidence": 0.0,
  "observation": "字符串",
  "principle": "字符串",
  "suggestion": "字符串",
  "memoryTip": "字符串"
}`;
}

// 构建 user prompt；不发送题库正确答案，避免模型被暗示
function buildUserPrompt({ question, principle, userAnswer }) {
  return `题目：${question}
设计原则：${principle}
用户答案：${userAnswer}
请先比较 A、B 两张图片，再独立输出判断。不要把用户答案当作正确答案，也不要输出题库答案。`;
}

// 从模型响应文本中提取 JSON（兼容 ```json 代码块和多余文本）
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  let t = text.trim();
  // 去除可能的 markdown 代码块
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
  t = t.replace(/^json\s*:/i, '').trim();
  try {
    return JSON.parse(t);
  } catch (_) {
    // 尝试找到第一个 { 和最后一个 }
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.substring(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

// 校验 AI 输出结构，返回错误数组（空数组表示通过）
// 严格检查：必须恰好包含 6 个字段
function validateExplanation(explanation) {
  if (!explanation || typeof explanation !== 'object') {
    return ['输出不是合法对象'];
  }
  const errors = [];
  const requiredTextFields = ['observation', 'principle', 'suggestion', 'memoryTip'];
  for (const field of requiredTextFields) {
    if (typeof explanation[field] !== 'string' || !explanation[field].trim()) {
      errors.push(`${field} 缺失或非字符串`);
    }
  }
  if (!['A', 'B'].includes(String(explanation.bestOption || '').toUpperCase())) errors.push('bestOption 必须是 A 或 B');
  if (typeof explanation.confidence !== 'number' || explanation.confidence < 0 || explanation.confidence > 1) {
    errors.push('confidence 必须是 0-1 的数字');
  }
  // 检查是否有多余字段
  const allowedFields = new Set(['bestOption', 'confidence', ...requiredTextFields]);
  for (const key of Object.keys(explanation)) {
    if (!allowedFields.has(key)) {
      errors.push(`多余字段: ${key}`);
    }
  }
  return errors;
}

/**
 * 调用 AI 生成训练题目的额外解析
 *
 * 入参：
 * - question: string，题目问题
 * - principle: string，设计原则
 * - userAnswer: string，用户选择的选项 id
 * - images: [{ label: 'A'|'B', url: string }]，两张对比图片
 *
 * 出参：
 * - { observation, principle, suggestion, memoryTip }
 *
 * 禁止：发送题库正确答案、返回 API Key、伪造响应
 * 失败时抛出 ApiError，由路由层捕获并降级返回本地解析
 */
export async function explainTrainingQuestion({ question, principle, userAnswer, images }) {
  const config = getConfig();
  const { apiKey, baseUrl, model, timeoutMs } = config;

  // 配置校验：API Key 必填
  if (!apiKey) {
    throw new ApiError(
      EXPLAIN_ERRORS.CONFIG_ERROR,
      '未配置 DASHSCOPE_API_KEY，请在 server/.env 中设置',
      500
    );
  }

  if (!Array.isArray(images) || images.length !== 2 || images.some((image) => !(/^(https:\/\/|data:image\/)/i.test(String(image?.url || ''))))) {
    throw new ApiError(EXPLAIN_ERRORS.CONFIG_ERROR, '训练题目必须提供两张合法图片', 400);
  }

  // 构建多模态请求体：文本 + A/B 两张图片
  const body = {
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildUserPrompt({ question, principle, userAnswer }) },
          ...images.map((image) => ({
            type: 'image_url',
            image_url: { url: image.url },
          })),
        ],
      },
    ],
    stream: false,
    // JSON Mode：约束模型输出合法 JSON
    response_format: { type: 'json_object' },
  };

  const url = `${baseUrl.replace(/\/+$/, '')}${CHAT_COMPLETIONS_PATH}`;
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  let httpStatus = 0;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    httpStatus = res.status;
  } catch (err) {
    clearTimeout(timeout);
    const elapsed = Date.now() - startTime;
    if (err.name === 'AbortError') {
      console.log('[training-explain] 超时', { model, httpStatus, elapsed, timeoutMs });
      throw new ApiError(EXPLAIN_ERRORS.TIMEOUT, `AI 解析请求超时（${Math.round(timeoutMs / 1000)}秒）`, 504);
    }
    console.log('[training-explain] 网络错误', { model, httpStatus, elapsed, error: err.message });
    throw new ApiError(EXPLAIN_ERRORS.PROVIDER_ERROR, `AI 解析服务网络错误: ${err.message}`, 502);
  }
  clearTimeout(timeout);

  const elapsed = Date.now() - startTime;

  // 解析响应体
  let respData;
  try {
    respData = await res.json();
  } catch (_) {
    console.log('[training-explain] 响应非 JSON', { model, httpStatus, elapsed });
    throw new ApiError(EXPLAIN_ERRORS.PROVIDER_ERROR, `AI 解析服务返回 HTTP ${httpStatus}，响应非 JSON`, 502);
  }

  const requestId = respData?.request_id || respData?.requestId || null;

  // 错误状态处理
  if (!res.ok) {
    console.log('[training-explain] 请求失败', { model, httpStatus, elapsed, requestId });
    if (httpStatus === 429) {
      throw new ApiError(EXPLAIN_ERRORS.PROVIDER_ERROR, 'AI 解析服务请求过于频繁，请稍后重试', 502);
    }
    throw new ApiError(EXPLAIN_ERRORS.PROVIDER_ERROR, `AI 解析请求失败（HTTP ${httpStatus}）`, 502);
  }

  // 提取内容
  const rawContent = respData?.choices?.[0]?.message?.content;
  const content = Array.isArray(rawContent)
    ? rawContent.map((part) => (typeof part === 'string' ? part : part?.text || '')).join('\n')
    : rawContent;

  if (!content) {
    console.log('[training-explain] 返回空内容', { model, httpStatus, elapsed, requestId });
    throw new ApiError(EXPLAIN_ERRORS.OUTPUT_INVALID, 'AI 解析返回空内容', 502);
  }

  // 解析 JSON
  const explanation = extractJson(content);
  if (!explanation) {
    console.log('[training-explain] 内容不是合法 JSON', { model, httpStatus, elapsed, requestId });
    throw new ApiError(EXPLAIN_ERRORS.OUTPUT_INVALID, 'AI 解析返回的内容不是合法 JSON', 502);
  }

  // 校验结构
  const validationErrors = validateExplanation(explanation);
  if (validationErrors.length > 0) {
    console.log('[training-explain] 结构校验失败', { model, httpStatus, elapsed, requestId, errors: validationErrors });
    throw new ApiError(EXPLAIN_ERRORS.OUTPUT_INVALID, `AI 输出校验失败: ${validationErrors.join('; ')}`, 502);
  }

  console.log('[training-explain] 成功', { model, httpStatus, elapsed, requestId });

  return {
    bestOption: String(explanation.bestOption).toUpperCase(),
    confidence: explanation.confidence,
    observation: explanation.observation,
    principle: explanation.principle,
    suggestion: explanation.suggestion,
    memoryTip: explanation.memoryTip,
  };
}
