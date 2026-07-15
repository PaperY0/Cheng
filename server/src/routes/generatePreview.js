// POST /api/generate-preview - 诊断建议效果图生成接口（第 1 步：契约 + 校验骨架）
//
// 请求格式：multipart/form-data
// - image: 原始图片文件，必填（JPG/PNG/WebP，≤10MB）
// - taskId: 非空字符串，必填
// - issueId: 非空字符串，必填
// - prompt: 非空字符串，必填（≤6000 字）
// - designType: 'ui' | 'graphic'，必填
// - goal: 可选字符串
//
// 成功响应：
// {
//   "taskId": "原任务 ID",
//   "issueId": "issue-1",
//   "status": "success",
//   "provider": "wan2.6-image",
//   "image": { "url": "...", "expiresAt": null }
// }
//
// 失败响应：
// { "error": { "code": "IMAGE_GENERATION_ERROR", "message": "用户可读的中文错误" } }
//
// 本步骤只完成路由注册 + 字段校验 + 错误类型定义，不真正调用阿里云生图接口。
// provider 骨架抛出 IMAGE_GENERATION_NOT_IMPLEMENTED (501)，路由层统一转成失败响应。

import { Router } from 'express';
import multer from 'multer';
import { ApiError } from '../middleware/errorHandler.js';
import { submitImageGenerationTask, queryImageGenerationTask, IMAGE_GEN_ERRORS } from '../providers/qwenImage.js';

const router = Router();

const ALLOWED_DESIGN_TYPES = ['ui', 'graphic'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROMPT_LENGTH = 6000; // prompt 最大字符数

// multer：内存存储，不写入磁盘
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('IMAGE_FORMAT_INVALID'));
    }
  },
});

// 校验表单字段，返回 { errors, cleaned }
function validateFields(taskId, issueId, prompt, designType, goal) {
  const errors = {};

  // taskId：非空字符串
  if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
    errors.taskId = 'taskId 为必填项且必须是非空字符串';
  }

  // issueId：非空字符串
  if (!issueId || typeof issueId !== 'string' || !issueId.trim()) {
    errors.issueId = 'issueId 为必填项且必须是非空字符串';
  }

  // prompt：非空字符串，≤6000 字
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    errors.prompt = 'prompt 为必填项且必须是非空字符串';
  } else if (prompt.length > MAX_PROMPT_LENGTH) {
    errors.prompt = `prompt 不能超过 ${MAX_PROMPT_LENGTH} 字（当前 ${prompt.length} 字）`;
  }

  // designType
  if (!designType || !ALLOWED_DESIGN_TYPES.includes(designType)) {
    errors.designType = 'designType 必须是 ui 或 graphic';
  }

  // goal：可选，但必须为字符串
  if (goal !== undefined && goal !== null && goal !== '' && typeof goal !== 'string') {
    errors.goal = 'goal 必须是字符串';
  }

  return { errors };
}

function getAllowedModelOverride(requestedModel) {
  if (!requestedModel) return null;
  const primaryModel = String(process.env.QWEN_IMAGE_MODEL || 'wan2.6-image').trim();
  const fallbackModel = String(process.env.QWEN_IMAGE_FALLBACK_MODEL || 'qwen-image-2.0').trim();
  if (requestedModel === primaryModel || requestedModel === fallbackModel) return requestedModel;
  throw new ApiError('IMAGE_GENERATION_ERROR', '不支持的生图模型', 400);
}

// 统一生成失败响应码映射
// provider 抛出的 ApiError 携带 code 和 status，路由层统一包装成 IMAGE_GENERATION_ERROR。
function toImageGenerationError(err) {
  // 路由层自己抛的 IMAGE_GENERATION_ERROR（已带正确 status）：原样透传
  if (err instanceof ApiError && err.code === 'IMAGE_GENERATION_ERROR') {
    return err;
  }
  if (err instanceof ApiError) {
    // 配置错误：500（服务端配置问题）
    if (err.code === IMAGE_GEN_ERRORS.CONFIG_ERROR) {
      return new ApiError('IMAGE_GENERATION_ERROR', err.message, 500);
    }
    // 入参错误：400
    if (err.code === IMAGE_GEN_ERRORS.PROVIDER_ERROR && err.status === 400) {
      return new ApiError('IMAGE_GENERATION_ERROR', err.message, 400);
    }
    // 限流：429
    if (err.code === IMAGE_GEN_ERRORS.RATE_LIMITED) {
      return new ApiError('IMAGE_GENERATION_ERROR', err.message, 429);
    }
    // 超时：504
    if (err.code === IMAGE_GEN_ERRORS.TIMEOUT) {
      return new ApiError('IMAGE_GENERATION_ERROR', err.message, 504);
    }
    // 输出无效 / provider 网络错误：502
    return new ApiError('IMAGE_GENERATION_ERROR', err.message, 502);
  }
  // 未知错误：500
  return new ApiError('IMAGE_GENERATION_ERROR', err && err.message ? err.message : '图片生成失败', 500);
}

// POST /api/generate-preview
// 只提交异步任务，立即返回 202，避免模型生成耗时占满 Render 的 HTTP 连接。
router.post('/', upload.single('image'), async (req, res, next) => {
  const routeStart = Date.now();
  try {
    const { taskId, issueId, prompt, designType, goal, model: requestedModel } = req.body;
    const file = req.file;

    // 图片校验：image 必填
    if (!file) {
      throw new ApiError('IMAGE_GENERATION_ERROR', '请上传图片文件', 400);
    }

    // 字段校验
    const { errors } = validateFields(taskId, issueId, prompt, designType, goal);
    if (Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0];
      throw new ApiError('IMAGE_GENERATION_ERROR', errors[firstField], 400);
    }

    // AI_IMAGE_PROVIDER 开关：关闭时不调用生图，返回明确中文错误
    const providerSwitch = String(process.env.AI_IMAGE_PROVIDER || '').trim();
    if (providerSwitch !== 'qwen-image') {
      throw new ApiError(
        'IMAGE_GENERATION_ERROR',
        '生图服务未开启（AI_IMAGE_PROVIDER 未设置为 qwen-image）',
        503
      );
    }

    const modelOverride = getAllowedModelOverride(requestedModel);
    const result = await submitImageGenerationTask({
      imageBuffer: file.buffer,
      imageMimeType: file.mimetype,
      prompt,
      designType,
      goal: goal || '',
      modelOverride,
    });

    const elapsed = Date.now() - routeStart;
    // 业务日志（不记录 API Key、请求体、图片数据）
    console.log('[generate-preview] 任务已提交', {
      taskId,
      issueId,
      provider: result.model,
      elapsed,
      requestId: result.requestId,
    });

    res.status(202).json({
      taskId,
      issueId,
      status: 'processing',
      provider: result.model,
      jobId: result.jobId,
      fallbackModel: String(process.env.QWEN_IMAGE_FALLBACK_MODEL || 'qwen-image-2.0').trim(),
      pollAfterMs: 5000,
    });
  } catch (err) {
    const elapsed = Date.now() - routeStart;
    // 业务错误日志（不记录 API Key、请求体、图片数据）
    console.log('[generate-preview] 失败', {
      taskId: req.body?.taskId,
      issueId: req.body?.issueId,
      elapsed,
      error: err.message || String(err),
    });

    // multer 文件格式错误
    if (err.message === 'IMAGE_FORMAT_INVALID') {
      return next(new ApiError('IMAGE_GENERATION_ERROR', '仅支持 JPG、PNG、WebP 格式', 400));
    }
    // multer 文件大小超限
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError('IMAGE_GENERATION_ERROR', '图片大小不能超过 10MB', 400));
    }
    // provider 异常统一包装成 IMAGE_GENERATION_ERROR
    return next(toImageGenerationError(err));
  }
});

// GET /api/generate-preview/:jobId
// 前端按状态轮询，不会让一次请求被模型执行时间拖住。
router.get('/:jobId', async (req, res, next) => {
  try {
    const result = await queryImageGenerationTask(req.params.jobId);
    if (result.status === 'processing') {
      return res.status(202).json({ status: 'processing', jobId: result.jobId, providerStatus: result.providerStatus, pollAfterMs: 5000 });
    }
    if (result.status === 'success') {
      return res.json({
        status: 'success',
        jobId: result.jobId,
        image: { url: result.url, expiresAt: result.expiresAt },
      });
    }
    return res.status(502).json({
      status: 'failed',
      jobId: result.jobId,
      error: { code: 'IMAGE_GENERATION_ERROR', message: result.message || '生图任务失败' },
    });
  } catch (err) {
    return next(toImageGenerationError(err));
  }
});

// 路由专属错误处理中间件：拦截 multer 在中间件阶段抛出的错误
// （这些错误不会进路由 handler 的 try/catch，会直接传给全局 errorHandler）
// 统一转成 IMAGE_GENERATION_ERROR，保持本接口错误码一致
router.use((err, _req, res, next) => {
  if (err && err.message === 'IMAGE_FORMAT_INVALID') {
    return res.status(400).json({
      error: { code: 'IMAGE_GENERATION_ERROR', message: '仅支持 JPG、PNG、WebP 格式' },
    });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: { code: 'IMAGE_GENERATION_ERROR', message: '图片大小不能超过 10MB' },
    });
  }
  // 其他错误交给全局 errorHandler
  next(err);
});

export default router;
