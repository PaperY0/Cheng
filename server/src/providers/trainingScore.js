// 维度打分训练 AI 评分 Provider
// 使用 DashScope OpenAI 兼容模式调用 Qwen-VL 视觉模型
//
// 设计原则：
// - 只发送用户上传的设计图，不发送本地标准答案
// - AI 独立对四个维度（layout/color/typography/whitespace）各打 1-10 分
// - 返回 aiScores、overallComment、strengths、improvements、confidence
// - API Key 只读取服务端环境变量，禁止返回给前端
// - AI 失败时由路由层降级返回本地兜底结果

import { ApiError } from '../middleware/errorHandler.js';

const ALLOWED_DIMENSIONS = ['layout', 'color', 'typography', 'whitespace'];

// 错误码常量
export const SCORE_ERRORS = {
  CONFIG_ERROR: 'TRAINING_SCORE_CONFIG_ERROR',
  PROVIDER_ERROR: 'TRAINING_SCORE_PROVIDER_ERROR',
  OUTPUT_INVALID: 'TRAINING_SCORE_OUTPUT_INVALID',
  TIMEOUT: 'TRAINING_SCORE_TIMEOUT',
};

const CHAT_COMPLETIONS_PATH = '/chat/completions';

// 读取并清理 API Key（仅服务端环境变量）
function getApiKey() {
  return String(process.env.DASHSCOPE_API_KEY || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

// 获取配置，复用 DASHSCOPE_BASE_URL/DASHSCOPE_API_KEY，超时使用 TRAINING_AI_TIMEOUT_MS
function getConfig() {
  const apiKey = getApiKey();
  const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = process.env.TRAINING_AI_MODEL || process.env.DASHSCOPE_MODEL || 'qwen3-vl-flash';
  const timeoutMs = Number(process.env.TRAINING_AI_TIMEOUT_MS) || 15000;
  return { apiKey, baseUrl, model, timeoutMs };
}

// 构建 system prompt，要求模型看图后独立对四个维度评分
function buildSystemPrompt() {
  return `你是审美训练的视觉评审助手。请仔细观察用户提供的页面设计图，独立对以下四个维度各打 1～10 的整数分：
- layout（排版与布局）
- color（配色）
- typography（字体与文字层级）
- whitespace（留白与视觉平衡）

严格约束：
1. 只返回合法 JSON，不要包含 markdown 代码块标记、注释或多余文字。
2. aiScores 的四个字段必须各是 1-10 的整数。
3. overallComment 是一句话总结，非空字符串。
4. strengths 是数组，至少 1 条，每条是非空字符串，描述做得好的地方。
5. improvements 是数组，至少 1 条，每条是非空字符串，描述需要改进的地方。
6. confidence 是 0-1 的数字，表示你对评分的信心。
7. 不要复述题目，不要输出与 JSON 无关的内容。

输出 JSON 结构：
{
  "aiScores": { "layout": 数字, "color": 数字, "typography": 数字, "whitespace": 数字 },
  "overallComment": "字符串",
  "strengths": ["字符串"],
  "improvements": ["字符串"],
  "confidence": 0.0
}`;
}

// 从模型响应文本中提取 JSON（兼容 ```json 代码块）
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  let t = text.trim();
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
  t = t.replace(/^json\s*:/i, '').trim();
  try {
    return JSON.parse(t);
  } catch (_) {
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
function validateOutput(output) {
  const errors = [];
  if (!output || typeof output !== 'object') return ['输出不是合法对象'];

  // aiScores
  const scores = output.aiScores;
  if (!scores || typeof scores !== 'object') {
    errors.push('缺少 aiScores');
  } else {
    for (const dim of ALLOWED_DIMENSIONS) {
      const v = scores[dim];
      if (typeof v !== 'number' || v < 1 || v > 10 || !Number.isInteger(v)) {
        errors.push(`aiScores.${dim} 必须是 1-10 的整数`);
      }
    }
  }

  // overallComment
  if (typeof output.overallComment !== 'string' || !output.overallComment.trim()) {
    errors.push('overallComment 缺失或非字符串');
  }

  // strengths
  if (!Array.isArray(output.strengths) || output.strengths.length < 1) {
    errors.push('strengths 必须至少包含 1 条');
  } else {
    output.strengths.forEach((s, i) => {
      if (typeof s !== 'string' || !s.trim()) errors.push(`strengths[${i}] 非字符串`);
    });
  }

  // improvements
  if (!Array.isArray(output.improvements) || output.improvements.length < 1) {
    errors.push('improvements 必须至少包含 1 条');
  } else {
    output.improvements.forEach((s, i) => {
      if (typeof s !== 'string' || !s.trim()) errors.push(`improvements[${i}] 非字符串`);
    });
  }

  // confidence
  if (typeof output.confidence !== 'number' || output.confidence < 0 || output.confidence > 1) {
    errors.push('confidence 必须是 0-1 的数字');
  }

  return errors;
}

/**
 * 调用 AI 对设计图进行四维度评分
 *
 * 入参：
 * - imageUrl: string，设计图 data URL 或 https URL
 *
 * 出参：
 * - { aiScores, overallComment, strengths, improvements, confidence }
 *
 * 禁止：发送本地标准答案、返回 API Key、伪造响应
 * 失败时抛出 ApiError，由路由层捕获并降级
 */
export async function scoreDesignWithQwenVL({ imageUrl }) {
  const config = getConfig();
  const { apiKey, baseUrl, model, timeoutMs } = config;

  if (!apiKey) {
    throw new ApiError(
      SCORE_ERRORS.CONFIG_ERROR,
      '未配置 DASHSCOPE_API_KEY，请在 server/.env 中设置',
      500
    );
  }

  if (typeof imageUrl !== 'string' || !(/^(https:\/\/|data:image\/)/i.test(imageUrl))) {
    throw new ApiError(SCORE_ERRORS.CONFIG_ERROR, '必须提供合法的设计图（data URL 或 https URL）', 400);
  }

  const body = {
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请观察这张页面设计图，独立对四个维度评分，只返回合法 JSON。' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    stream: false,
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
      console.log('[training-score] 超时', { model, httpStatus, elapsed, timeoutMs });
      throw new ApiError(SCORE_ERRORS.TIMEOUT, `AI 评分请求超时（${Math.round(timeoutMs / 1000)}秒）`, 504);
    }
    console.log('[training-score] 网络错误', { model, httpStatus, elapsed, error: err.message });
    throw new ApiError(SCORE_ERRORS.PROVIDER_ERROR, `AI 评分服务网络错误: ${err.message}`, 502);
  }
  clearTimeout(timeout);

  const elapsed = Date.now() - startTime;

  let respData;
  try {
    respData = await res.json();
  } catch (_) {
    console.log('[training-score] 响应非 JSON', { model, httpStatus, elapsed });
    throw new ApiError(SCORE_ERRORS.PROVIDER_ERROR, `AI 评分服务返回 HTTP ${httpStatus}，响应非 JSON`, 502);
  }

  const requestId = respData?.request_id || respData?.requestId || null;

  if (!res.ok) {
    console.log('[training-score] 请求失败', { model, httpStatus, elapsed, requestId });
    if (httpStatus === 401 || httpStatus === 403) {
      throw new ApiError(
        'TRAINING_SCORE_AUTH_ERROR',
        '通义千问 API Key 无效或已被撤销，请检查 server/.env 中的 DASHSCOPE_API_KEY。',
        502
      );
    }
    if (httpStatus === 429) {
      throw new ApiError(SCORE_ERRORS.PROVIDER_ERROR, 'AI 评分服务请求过于频繁，请稍后重试', 502);
    }
    throw new ApiError(SCORE_ERRORS.PROVIDER_ERROR, `AI 评分请求失败（HTTP ${httpStatus}）`, 502);
  }

  const rawContent = respData?.choices?.[0]?.message?.content;
  const content = Array.isArray(rawContent)
    ? rawContent.map((part) => (typeof part === 'string' ? part : part?.text || '')).join('\n')
    : rawContent;

  if (!content) {
    console.log('[training-score] 返回空内容', { model, httpStatus, elapsed, requestId });
    throw new ApiError(SCORE_ERRORS.OUTPUT_INVALID, 'AI 评分返回空内容', 502);
  }

  const output = extractJson(content);
  if (!output) {
    console.log('[training-score] 内容不是合法 JSON', { model, httpStatus, elapsed, requestId });
    throw new ApiError(SCORE_ERRORS.OUTPUT_INVALID, 'AI 评分返回的内容不是合法 JSON', 502);
  }

  const validationErrors = validateOutput(output);
  if (validationErrors.length > 0) {
    console.log('[training-score] 结构校验失败', { model, httpStatus, elapsed, requestId, errors: validationErrors });
    throw new ApiError(SCORE_ERRORS.OUTPUT_INVALID, `AI 输出校验失败: ${validationErrors.join('; ')}`, 502);
  }

  console.log('[training-score] 成功', { model, httpStatus, elapsed, requestId });

  return {
    aiScores: {
      layout: output.aiScores.layout,
      color: output.aiScores.color,
      typography: output.aiScores.typography,
      whitespace: output.aiScores.whitespace,
    },
    overallComment: output.overallComment,
    strengths: output.strengths,
    improvements: output.improvements,
    confidence: output.confidence,
  };
}
