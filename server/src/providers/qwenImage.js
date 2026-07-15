// 阿里云百炼 通义千问生图 Provider（真实调用）
// 文档：https://help.aliyun.com/zh/model-studio/qwen-image-edit-api
//
// 配置隔离原则：
// - 诊断使用 DASHSCOPE_BASE_URL + DASHSCOPE_MODEL（qwen3-vl-flash），走 OpenAI 兼容 /chat/completions
// - 生图使用 QWEN_IMAGE_BASE_URL + QWEN_IMAGE_MODEL（wan2.6-image / qwen-image-2.0）。
//   万相 2.6 的编辑任务耗时不稳定，生产环境使用 DashScope 异步任务接口，
//   避免浏览器、Render 与模型之间维持长连接而超时。
// - 两者不允许共用模型配置和端点
// - API Key 只读取服务端 DASHSCOPE_API_KEY，禁止返回给前端
// - 禁止把图片写入磁盘

import { ApiError } from '../middleware/errorHandler.js';

// 错误码常量（统一在路由层使用，provider 内部抛 ApiError）
export const IMAGE_GEN_ERRORS = {
  CONFIG_ERROR: 'AI_IMAGE_CONFIG_ERROR',
  PROVIDER_ERROR: 'IMAGE_PROVIDER_ERROR',
  OUTPUT_INVALID: 'IMAGE_OUTPUT_INVALID',
  TIMEOUT: 'IMAGE_GENERATION_TIMEOUT',
  RATE_LIMITED: 'IMAGE_RATE_LIMITED',
};

// DashScope 原生生图端点路径（与诊断的 OpenAI 兼容端点 /chat/completions 完全不同）
const IMAGE_GENERATION_PATH = '/api/v1/services/aigc/multimodal-generation/generation';
const ASYNC_IMAGE_GENERATION_PATH = '/api/v1/services/aigc/image-generation/generation';

// 读取并清理 API Key（仅服务端环境变量，不进响应、不进日志）
function getApiKey() {
  return String(process.env.DASHSCOPE_API_KEY || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

function resolveImageBaseUrl() {
  const explicit = String(process.env.QWEN_IMAGE_BASE_URL || '').trim();
  if (explicit) return explicit;

  // Render 环境通常只配置了诊断端点，例如：
  // https://{workspace}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
  // 原生生图 API 使用相同业务空间的 origin + /api/v1/... 路径，可安全推导。
  const visionBase = String(process.env.DASHSCOPE_BASE_URL || '').trim();
  try {
    return visionBase ? new URL(visionBase).origin : '';
  } catch (_) {
    return '';
  }
}

// 生图专用配置：与诊断配置完全隔离
function getImageConfig() {
  const apiKey = getApiKey();
  const baseUrl = resolveImageBaseUrl();
  const model = process.env.QWEN_IMAGE_MODEL || 'wan2.6-image';
  const timeoutMs = Number(process.env.QWEN_IMAGE_TIMEOUT_MS) || 60000;
  const styleProfile = process.env.QWEN_IMAGE_STYLE_PROFILE || '';
  const referenceImages = String(process.env.QWEN_STYLE_REFERENCE_URLS || '')
    .split(',')
    .map((url) => url.trim())
    .filter((url) => /^https:\/\//i.test(url))
    .slice(0, 2);
  return { apiKey, baseUrl, model, timeoutMs, styleProfile, referenceImages };
}

// 仅供健康检查使用：返回配置是否到达运行进程，绝不返回密钥或完整端点。
// 这样可以区分「Render 没有注入环境变量」和「第三方模型调用失败」。
export function getImageServiceStatus() {
  const explicitBaseUrl = String(process.env.QWEN_IMAGE_BASE_URL || '').trim();
  const visionBaseUrl = String(process.env.DASHSCOPE_BASE_URL || '').trim();
  const config = getImageConfig();

  return {
    enabled: String(process.env.AI_IMAGE_PROVIDER || '').trim() === 'qwen-image',
    apiKeyConfigured: Boolean(config.apiKey),
    baseUrlResolved: Boolean(config.baseUrl),
    baseUrlSource: explicitBaseUrl ? 'QWEN_IMAGE_BASE_URL' : visionBaseUrl ? 'DASHSCOPE_BASE_URL' : null,
    model: config.model,
  };
}

// 将 Buffer 转为 base64 data URL（模型支持的图片输入格式）
function bufferToDataUrl(buffer, mimeType) {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

// 构建修改指令文本，约束模型只执行当前修改建议，不重新设计整张图
function buildEditPrompt(prompt, designType, goal, styleProfile, hasReferenceImages) {
  const typeLabel = designType === 'ui' ? '界面设计' : '平面设计';
  return `你是一个专业的${typeLabel}效果生成助手和审美总监。请对用户上传的原始设计图进行高保真的局部编辑，只执行下面这一条视觉修改建议，生成修改后的设计效果图。

${hasReferenceImages ? '后续图片是风格参考图，只允许学习其留白、网格、层级、配色比例、圆角、阴影和克制程度，严禁复制参考图的品牌、文案、Logo、插画、具体布局或内容。' : ''}

审美目标：
${styleProfile || '苹果式克制、清晰、轻盈的现代产品设计；大留白；明确的信息层级；低饱和蓝白配色；细腻但不过度的玻璃质感；按钮和主要操作具有清晰对比；避免廉价模板感和装饰堆叠。'}

${goal ? `用户的设计目标是：${goal}。` : ''}

需要执行的修改建议：
${prompt}

严格约束（必须遵守）：
1. 这是 UI 截图/平面设计稿的局部编辑，不是重新设计，不是自由创作。
2. 只执行上述修改建议涉及的区域，其他区域必须与原图保持一致。
3. 原图中的所有中文、英文、数字、Logo、导航、按钮文字必须逐字保持不变，禁止重写、乱码、替换或新增文案。
4. 原图中的图标、插画、头像和品牌识别元素必须保持原样，除非修改建议明确要求修改它们。
5. 不允许删除主体内容、改变画布比例、改变页面整体布局或改变原有视觉风格。
6. 不允许增加云朵、上传图标、装饰插画、按钮、标题等修改建议未要求的新元素。
7. 修改区域要自然融入原图，边缘、间距、对齐、字号和颜色应保持专业且克制。
8. 输出与原图相同画布尺寸的完整设计效果图。`;
}

// 从模型响应中提取图片 URL，兼容多种返回结构
function extractImageUrl(data) {
  if (!data || typeof data !== 'object') return null;

  // 结构 1：output.choices[0].message.content 数组中包含 {"image": "url"}
  const choices = data.output?.choices || data.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const msg = choices[0].message || choices[0].delta;
    if (msg && Array.isArray(msg.content)) {
      for (const item of msg.content) {
        if (typeof item === 'string') continue; // 跳过纯文本
        if (item && typeof item.image === 'string' && item.image) return item.image;
        if (item && typeof item.url === 'string' && item.url) return item.url;
        if (item && item.image_url && typeof item.image_url === 'string') return item.image_url;
        if (item && item.image_url && item.image_url.url) return item.image_url.url;
      }
    }
    // content 可能是字符串（某些兼容模式）
    if (msg && typeof msg.content === 'string' && msg.content.startsWith('http')) {
      return msg.content;
    }
  }

  // 结构 2：output.results[].url 或 results[].image
  const results = data.output?.results || data.results;
  if (Array.isArray(results) && results.length > 0) {
    const r = results[0];
    if (r && typeof r.url === 'string' && r.url) return r.url;
    if (r && typeof r.image === 'string' && r.image) return r.image;
    if (r && r.image_url && typeof r.image_url === 'string') return r.image_url;
  }

  // 结构 3：output.image 或 output.url（部分兼容模式）
  if (data.output) {
    if (typeof data.output.image === 'string' && data.output.image) return data.output.image;
    if (typeof data.output.url === 'string' && data.output.url) return data.output.url;
  }

  return null;
}

function extractTaskId(data) {
  const taskId = data?.output?.task_id || data?.output?.taskId || data?.task_id || data?.taskId;
  return typeof taskId === 'string' && taskId.trim() ? taskId.trim() : null;
}

function getTaskStatus(data) {
  return String(data?.output?.task_status || data?.output?.taskStatus || data?.task_status || '').toUpperCase();
}

function buildGenerationBody({ imageBuffer, imageMimeType, prompt, designType, goal, model, styleProfile, referenceImages, asyncMode = false }) {
  const dataUrl = bufferToDataUrl(imageBuffer, imageMimeType);
  const editPrompt = buildEditPrompt(prompt, designType, goal, styleProfile, referenceImages.length > 0);
  const imageMessages = [
    { image: dataUrl },
    ...referenceImages.map((url) => ({ image: url })),
    { text: editPrompt },
  ];

  return {
    model,
    input: { messages: [{ role: 'user', content: imageMessages }] },
    parameters: {
      ...(asyncMode ? { max_images: 1 } : { n: 1 }),
      watermark: false,
      prompt_extend: false,
      negative_prompt: '重新设计整张页面，改变布局，改变画布比例，替换原有文字，中文乱码，英文乱码，新增无关图标，新增云朵上传图标，新增装饰插画，删除原有内容，低清晰度，模糊，畸变，重复元素，错误拼写',
      ...(model === 'wan2.6-image' ? { enable_interleave: false, size: '2K' } : {}),
    },
  };
}

function validateImageRequest({ imageBuffer, imageMimeType, prompt, model, apiKey, baseUrl }) {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, 'imageBuffer 缺失或为空', 400);
  }
  if (!imageMimeType || typeof imageMimeType !== 'string') {
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, 'imageMimeType 缺失', 400);
  }
  if (!prompt || typeof prompt !== 'string') {
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, 'prompt 缺失', 400);
  }
  if (!apiKey) {
    throw new ApiError(IMAGE_GEN_ERRORS.CONFIG_ERROR, '未配置 DASHSCOPE_API_KEY，请在 server/.env 中设置', 500);
  }
  if (!baseUrl) {
    throw new ApiError(IMAGE_GEN_ERRORS.CONFIG_ERROR, '未配置 QWEN_IMAGE_BASE_URL，生图接口需要独立的 base url', 500);
  }
  if (String(model).startsWith('qwen3-vl')) {
    throw new ApiError(IMAGE_GEN_ERRORS.CONFIG_ERROR, '生图接口必须使用 qwen-image 系列模型，不能复用 qwen3-vl 诊断模型', 500);
  }
}

// 从错误响应中判断是否为 API Key 问题
function isApiKeyError(status, errData) {
  if (status === 401 || status === 403) return true;
  const code = String(errData?.code || errData?.error?.code || '');
  const msg = String(errData?.message || errData?.error?.message || '');
  if (code === 'InvalidApiKey' || code === 'AccessDenied') return true;
  if (/incorrect api key|invalid api key|api.?key.*(invalid|error)/i.test(msg)) return true;
  return false;
}

/**
 * 调用通义千问生图模型，根据原图 + 修改建议 Prompt 生成"诊断建议效果图"
 *
 * 入参：
 * - imageBuffer: Buffer，原始图片二进制（必填，来自 multer req.file.buffer）
 * - imageMimeType: string，原图 MIME（必填）
 * - prompt: string，诊断建议的可执行 Prompt（必填，已在路由层校验长度）
 * - designType: 'ui' | 'graphic'
 * - goal: string，可选设计目标
 *
 * 出参：
 * - { url: string, expiresAt: string | null, requestId: string | null }
 *   url 为生成图片的访问 URL（24h 有效），expiresAt 为过期时间估算
 *
 * 禁止：写磁盘、返回 API Key、伪造 URL、返回诊断 JSON
 */
export async function generateImageWithQwenImage({ imageBuffer, imageMimeType, prompt, designType, goal, modelOverride, timeoutOverride }) {
  const config = getImageConfig();
  const { apiKey, baseUrl, styleProfile, referenceImages } = config;
  const model = modelOverride || config.model;
  const timeoutMs = timeoutOverride || config.timeoutMs;

  validateImageRequest({ imageBuffer, imageMimeType, prompt, model, apiKey, baseUrl });

  // 构建请求体：DashScope 原生 multimodal-generation 格式
  const body = buildGenerationBody({ imageBuffer, imageMimeType, prompt, designType, goal, model, styleProfile, referenceImages });

  const url = `${baseUrl.replace(/\/+$/, '')}${IMAGE_GENERATION_PATH}`;
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
      console.log('[qwen-image] 超时', { model, httpStatus, elapsed, timeoutMs });
      throw new ApiError(IMAGE_GEN_ERRORS.TIMEOUT, `生图请求超时（${Math.round(timeoutMs / 1000)}秒）`, 504);
    }
    console.log('[qwen-image] 网络错误', { model, httpStatus, elapsed, error: err.message });
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, `生图服务网络错误: ${err.message}`, 502);
  }
  clearTimeout(timeout);

  const elapsed = Date.now() - startTime;

  // 解析响应体（不记录完整响应，只提取必要字段）
  let respData;
  try {
    respData = await res.json();
  } catch (_) {
    console.log('[qwen-image] 响应非 JSON', { model, httpStatus, elapsed });
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, `生图服务返回 HTTP ${httpStatus}，响应非 JSON`, 502);
  }

  // 提取 requestId 用于日志（不记录完整响应）
  const requestId = respData?.request_id || respData?.requestId || null;

  // 错误状态处理
  if (!res.ok) {
    const errCode = String(respData?.code || respData?.error?.code || '');
    const errMsg = String(respData?.message || respData?.error?.message || '');

    // 401/403/API Key 错误
    if (isApiKeyError(httpStatus, respData)) {
      console.log('[qwen-image] 鉴权失败', { model, httpStatus, elapsed, requestId, errCode });
      throw new ApiError(
        IMAGE_GEN_ERRORS.CONFIG_ERROR,
        '通义千问 API Key 无效或已被撤销，请检查 server/.env 中的 DASHSCOPE_API_KEY',
        500
      );
    }

    // 429 限流
    if (httpStatus === 429 || errCode === 'Throttling' || errCode === 'RateLimit') {
      console.log('[qwen-image] 限流', { model, httpStatus, elapsed, requestId, errCode });
      throw new ApiError(
        IMAGE_GEN_ERRORS.RATE_LIMITED,
        '生图服务请求过于频繁，请稍后重试',
        429
      );
    }

    // 5xx 服务端错误
    if (httpStatus >= 500) {
      console.log('[qwen-image] 服务端错误', { model, httpStatus, elapsed, requestId, errCode });
      const msg = errMsg || `生图服务返回 HTTP ${httpStatus}`;
      throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, msg, 502);
    }

    // 其他错误
    console.log('[qwen-image] 请求失败', { model, httpStatus, elapsed, requestId, errCode });
    const msg = errMsg || `生图请求失败（HTTP ${httpStatus}）`;
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, msg, 502);
  }

  // 检查 DashScope 业务层错误（HTTP 200 但 code/message 非空）
  if (respData.code && respData.message) {
    console.log('[qwen-image] 业务错误', { model, httpStatus, elapsed, requestId, errCode: respData.code });
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, respData.message, 502);
  }

  // 提取图片 URL
  const imageUrl = extractImageUrl(respData);
  if (!imageUrl) {
    console.log('[qwen-image] 无法提取图片 URL', { model, httpStatus, elapsed, requestId });
    throw new ApiError(
      IMAGE_GEN_ERRORS.OUTPUT_INVALID,
      '生图服务返回的内容中未找到有效的图片 URL',
      502
    );
  }

  // 估算过期时间：阿里云生图 URL 有效期 24 小时
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  console.log('[qwen-image] 生成成功', { model, httpStatus, elapsed, requestId });

  return {
    url: imageUrl,
    expiresAt,
    requestId,
    model,
  };
}

/**
 * 提交异步生图任务。这里只等待 DashScope 接收任务（通常很快返回 taskId），
 * 不等待模型出图，避免 Render 长连接被代理层中断。
 */
export async function submitImageGenerationTask({ imageBuffer, imageMimeType, prompt, designType, goal, modelOverride, timeoutOverride }) {
  const config = getImageConfig();
  const { apiKey, baseUrl, styleProfile, referenceImages } = config;
  const model = modelOverride || config.model;
  validateImageRequest({ imageBuffer, imageMimeType, prompt, model, apiKey, baseUrl });

  const url = `${baseUrl.replace(/\/+$/, '')}${ASYNC_IMAGE_GENERATION_PATH}`;
  const body = buildGenerationBody({ imageBuffer, imageMimeType, prompt, designType, goal, model, styleProfile, referenceImages, asyncMode: true });
  const controller = new AbortController();
  // 提交阶段只等待平台接收 base64 图片并创建任务；不等待出图。
  // Render 冷启动和较大截图上传偶尔会超过 20 秒，因此保留 60 秒余量。
  const timeoutMs = timeoutOverride || Number(process.env.QWEN_IMAGE_SUBMIT_TIMEOUT_MS) || 60000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'X-DashScope-Async': 'enable' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    if (err.name === 'AbortError') {
      throw new ApiError(IMAGE_GEN_ERRORS.TIMEOUT, `生图任务提交超时（${Math.round(timeoutMs / 1000)}秒）`, 504);
    }
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, `生图服务网络错误: ${err.message}`, 502);
  } finally {
    clearTimeout(timeout);
  }

  let data;
  try { data = await res.json(); } catch (_) {
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, `生图服务返回 HTTP ${res.status}，响应非 JSON`, 502);
  }
  const requestId = data?.request_id || data?.requestId || null;
  if (!res.ok || (data?.code && data?.message)) {
    if (isApiKeyError(res.status, data)) throw new ApiError(IMAGE_GEN_ERRORS.CONFIG_ERROR, '通义千问 API Key 无效或已被撤销，请检查服务端配置', 500);
    if (res.status === 429) throw new ApiError(IMAGE_GEN_ERRORS.RATE_LIMITED, '生图服务请求过于频繁，请稍后重试', 429);
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, data?.message || `生图任务提交失败（HTTP ${res.status}）`, 502);
  }
  const jobId = extractTaskId(data);
  if (!jobId) throw new ApiError(IMAGE_GEN_ERRORS.OUTPUT_INVALID, '生图服务未返回任务 ID', 502);

  console.log('[qwen-image] 异步任务已提交', { model, requestId, elapsed: Date.now() - startTime });
  return { jobId, requestId, model };
}

/** 查询异步任务；任务完成后才返回图片 URL。 */
export async function queryImageGenerationTask(jobId) {
  if (!jobId || typeof jobId !== 'string' || jobId.length > 200) {
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, '生图任务 ID 非法', 400);
  }
  const { apiKey, baseUrl } = getImageConfig();
  if (!apiKey || !baseUrl) throw new ApiError(IMAGE_GEN_ERRORS.CONFIG_ERROR, '生图服务配置不完整，请检查服务端环境变量', 500);

  let res;
  try {
    res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/v1/tasks/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (err) {
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, `查询生图任务失败: ${err.message}`, 502);
  }
  let data;
  try { data = await res.json(); } catch (_) {
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, `查询生图任务返回 HTTP ${res.status}，响应非 JSON`, 502);
  }
  if (!res.ok || (data?.code && data?.message && !data?.output)) {
    if (isApiKeyError(res.status, data)) throw new ApiError(IMAGE_GEN_ERRORS.CONFIG_ERROR, '通义千问 API Key 无效或已被撤销，请检查服务端配置', 500);
    throw new ApiError(IMAGE_GEN_ERRORS.PROVIDER_ERROR, data?.message || `查询生图任务失败（HTTP ${res.status}）`, 502);
  }

  const providerStatus = getTaskStatus(data);
  const requestId = data?.request_id || data?.requestId || null;
  if (providerStatus === 'PENDING' || providerStatus === 'RUNNING') {
    return { status: 'processing', jobId, requestId, providerStatus };
  }
  if (providerStatus === 'SUCCEEDED') {
    const url = extractImageUrl(data);
    if (!url) throw new ApiError(IMAGE_GEN_ERRORS.OUTPUT_INVALID, '生图任务完成但未返回图片 URL', 502);
    return { status: 'success', jobId, requestId, url, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
  }
  const failure = data?.output?.message || data?.message || '生图任务未完成';
  return { status: 'failed', jobId, requestId, providerStatus: providerStatus || 'UNKNOWN', message: failure };
}
