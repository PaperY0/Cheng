// 阿里云百炼 通义千问 VL 视觉诊断 Provider
// 使用 DashScope OpenAI 兼容模式调用多模态模型

import { ApiError } from '../middleware/errorHandler.js';

const ALLOWED_DIMENSIONS = ['layout', 'color', 'typography', 'whitespace'];
const ALLOWED_SEVERITY = ['high', 'medium', 'low'];

function getTimeoutMs(value) {
  const parsed = Number.parseInt(value, 10);
  // 视觉模型在冷启动或处理较大设计稿时通常需要超过 30 秒；仍给出上限，
  // 防止异常连接无限占用 Render 的请求资源。
  if (!Number.isFinite(parsed)) return 90000;
  return Math.min(Math.max(parsed, 10000), 120000);
}

// 构建 system prompt，引导模型输出结构化 JSON
function buildSystemPrompt(designType, goal, focusDimensions) {
  const typeLabel = designType === 'ui' ? '界面设计（UI）' : '平面设计';
  const focusLabel = focusDimensions.map((d) => {
    const map = { layout: '排版与布局', color: '配色', typography: '字体与文字层级', whitespace: '留白与视觉平衡' };
    return map[d] || d;
  }).join('、');

  return `你是专业的 UI 和平面设计诊断助手。请分析用户上传的${typeLabel}作品，重点从以下维度给出诊断：${focusLabel}。
${goal ? `用户的设计目标是：${goal}。` : ''}
请严格遵循以下规则：
1. 只返回合法 JSON，不要包含 markdown 代码块标记、注释或多余文字。
2. 所有描述必须具体、可执行，禁止使用"看起来不高级""配色不好看"等空泛描述。
3. 每个问题必须基于设计四原则（对比、对齐、重复、亲密性）中的至少一条。
4. scores 每项为 1-10 的整数。
5. issues 必须是一个包含且仅包含 3 个元素的 JSON 数组；数组中的每一个元素都必须是对象，绝对不能是字符串、数字、null 或 issue ID。
6. dimension 只能是 layout/color/typography/whitespace，severity 只能是 high/medium/low。
7. 每条 issue 必须包含 location、observation、reason、suggestion、prompt 字段。
8. prompt 字段必须是可以直接复制给外部 AI（如 Claude/ChatGPT）的修改指令。

输出 JSON 结构：
{
  "summary": {
    "oneLineConclusion": "一句话结论",
    "overallState": "整体状态描述",
    "confidence": 0.0到1.0的数字,
    "confidenceNote": "置信度说明"
  },
  "scores": { "layout": 数字, "color": 数字, "typography": 数字, "whitespace": 数字 },
  "priorities": ["issue-1", "issue-2", "issue-3"],
  "issues": [
    {
      "id": "issue-1",
      "title": "具体问题标题",
      "dimension": "layout|color|typography|whitespace",
      "location": "问题所在位置的文字描述",
      "severity": "high|medium|low",
      "observation": "客观事实观察",
      "reason": "为什么这是问题的原因",
      "suggestion": "可执行的修改建议",
      "prompt": "可直接复制给外部 AI 的修改 Prompt",
      "principle": "对比|对齐|重复|亲密性"
    }
  ]
}`;
}

// 将 Buffer 转为 base64 data URL
function bufferToDataUrl(buffer, mimeType) {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

// 校验模型输出结构，返回错误数组（空数组表示通过）
function validateReport(report) {
  const errors = [];

  if (!report || typeof report !== 'object') {
    return ['输出不是合法对象'];
  }

  // summary
  const s = report.summary;
  if (!s || typeof s !== 'object') {
    errors.push('缺少 summary');
  } else {
    if (typeof s.oneLineConclusion !== 'string' || !s.oneLineConclusion) errors.push('summary.oneLineConclusion 缺失');
    if (typeof s.overallState !== 'string' || !s.overallState) errors.push('summary.overallState 缺失');
    if (typeof s.confidence !== 'number' || s.confidence < 0 || s.confidence > 1) errors.push('summary.confidence 必须是 0-1 的数字');
    if (typeof s.confidenceNote !== 'string') errors.push('summary.confidenceNote 缺失');
  }

  // scores
  const scores = report.scores;
  if (!scores || typeof scores !== 'object') {
    errors.push('缺少 scores');
  } else {
    for (const dim of ALLOWED_DIMENSIONS) {
      const v = scores[dim];
      if (typeof v !== 'number' || v < 1 || v > 10 || !Number.isInteger(v)) {
        errors.push(`scores.${dim} 必须是 1-10 的整数`);
      }
    }
  }

  // issues
  const issues = report.issues;
  if (!Array.isArray(issues) || issues.length !== 3) {
    errors.push('issues 必须恰好包含 3 条问题');
  } else {
    issues.forEach((issue, i) => {
      if (!issue || typeof issue !== 'object') {
        errors.push(`issue[${i}] 不是合法对象`);
        return;
      }
      const required = ['id', 'title', 'dimension', 'location', 'severity', 'observation', 'reason', 'suggestion', 'prompt', 'principle'];
      for (const f of required) {
        if (typeof issue[f] !== 'string' || !issue[f]) {
          errors.push(`issue[${i}].${f} 缺失或非字符串`);
        }
      }
      if (issue.dimension && !ALLOWED_DIMENSIONS.includes(issue.dimension)) {
        errors.push(`issue[${i}].dimension 非法: ${issue.dimension}`);
      }
      if (issue.severity && !ALLOWED_SEVERITY.includes(issue.severity)) {
        errors.push(`issue[${i}].severity 非法: ${issue.severity}`);
      }
    });
  }

  // priorities
  if (!Array.isArray(report.priorities)) {
    errors.push('priorities 必须是数组');
  }

  return errors;
}

// 从模型响应文本中提取 JSON（兼容 ```json 代码块）
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

// 主调用函数
export async function diagnoseWithQwenVL({ imageBuffer, imageMimeType, designType, goal, focusDimensions }) {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
  const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = process.env.DASHSCOPE_MODEL || 'qwen3-vl-flash';
  const timeoutMs = getTimeoutMs(process.env.DASHSCOPE_TIMEOUT_MS);

  // 配置校验
  if (!apiKey) {
    throw new ApiError('AI_CONFIG_ERROR', '未配置 DASHSCOPE_API_KEY，请在 server/.env 中设置', 500);
  }
  if (model.startsWith('qwen-image')) {
    throw new ApiError('AI_CONFIG_ERROR', '诊断接口必须使用 qwen3-vl-flash 等视觉理解模型，qwen-image-2.0 需要单独的生图接口。', 500);
  }

  const dataUrl = bufferToDataUrl(imageBuffer, imageMimeType);

  const body = {
    model,
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(designType, goal, focusDimensions),
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请根据要求分析这张设计图，并只返回合法 JSON。' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    stream: false,
    // Qwen3-VL 支持 JSON Mode；仅靠提示词无法保证每次都返回纯 JSON。
    response_format: { type: 'json_object' },
  };

  async function requestModel(requestBody) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new ApiError('QWEN_PROVIDER_ERROR', `通义千问 VL 请求超时（${Math.round(timeoutMs / 1000)}秒）`, 504);
      }
      throw new ApiError('QWEN_PROVIDER_ERROR', `通义千问 VL 网络错误: ${err.message}`, 502);
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      let msg = `通义千问 VL 返回 HTTP ${res.status}`;
      try {
        const errData = await res.json();
        const providerMessage = String(errData?.message || errData?.error?.message || '');
        if (
          res.status === 401 || res.status === 403 ||
          errData?.code === 'InvalidApiKey' ||
          errData?.error?.code === 'InvalidApiKey' ||
          /incorrect api key|invalid api key|api.?key.*(invalid|error)/i.test(providerMessage)
        ) {
          msg = '通义千问 API Key 无效或已被撤销，请检查 server/.env 中的 DASHSCOPE_API_KEY。';
        } else if (providerMessage) {
          msg = providerMessage;
        }
      } catch (_) {}
      throw new ApiError('QWEN_PROVIDER_ERROR', msg, 502);
    }

    const data = await res.json();
    const rawContent = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const content = Array.isArray(rawContent)
      ? rawContent.map((part) => typeof part === 'string' ? part : part?.text || '').join('\n')
      : rawContent;
    if (!content) throw new ApiError('AI_OUTPUT_INVALID', '通义千问 VL 返回空内容', 502);
    return content;
  }

  let content = await requestModel(body);
  let report = extractJson(content);
  let validationErrors = report ? validateReport(report) : ['返回内容不是合法 JSON'];

  // 模型偶尔会返回合法 JSON，但不满足严格字段/条数约束。修复阶段只处理
  // 首轮文本，绝不重复发送图片；否则会再次触发耗时的视觉推理，既慢又容易超时。
  if (!report || validationErrors.length > 0) {
    const repairBody = {
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(designType, goal, focusDimensions),
        },
        {
          role: 'user',
          content: `请修复以下诊断结果的 JSON 结构，保留其已有的设计判断，不要重新分析图片，也不要编造新事实。
校验问题：${validationErrors.slice(0, 4).join('；')}。
只输出完整合法 JSON；issues 必须是恰好 3 个对象组成的数组，每个对象包含所有要求字段，不能出现字符串数组、null 或 issue ID。
待修复内容：\n${String(content).slice(0, 24000)}`,
        },
      ],
      model,
      stream: false,
      response_format: { type: 'json_object' },
    };
    content = await requestModel(repairBody);
    report = extractJson(content);
    validationErrors = report ? validateReport(report) : ['返回内容不是合法 JSON'];
  }

  if (!report) throw new ApiError('AI_OUTPUT_INVALID', '通义千问 VL 返回的内容不是合法 JSON', 502);
  if (validationErrors.length > 0) {
    throw new ApiError('AI_OUTPUT_INVALID', `模型输出校验失败: ${validationErrors.join('; ')}`, 502);
  }
  return report;
}
