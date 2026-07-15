import { Router } from 'express';
import multer from 'multer';
import { ApiError } from '../middleware/errorHandler.js';
import { generateMockReport } from '../mock/diagnosisReport.js';
import { diagnoseWithQwenVL } from '../providers/qwenVision.js';

const router = Router();

const ALLOWED_DESIGN_TYPES = ['ui', 'graphic'];
const ALLOWED_DIMENSIONS = ['layout', 'color', 'typography', 'whitespace'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

// 校验表单字段
function validateFields(taskId, designType, goal, focusDimensionsRaw) {
  const errors = {};

  // taskId：非空字符串
  if (!taskId || typeof taskId !== 'string' || !taskId.trim()) {
    errors.taskId = 'taskId 为必填项且必须是非空字符串';
  }

  // designType
  if (!designType || !ALLOWED_DESIGN_TYPES.includes(designType)) {
    errors.designType = 'designType 必须是 ui 或 graphic';
  }

  // goal：可选，但必须为字符串
  if (goal !== undefined && goal !== null && goal !== '' && typeof goal !== 'string') {
    errors.goal = 'goal 必须是字符串';
  }

  // focusDimensions：JSON 字符串数组
  let focusDimensions = null;
  try {
    focusDimensions = typeof focusDimensionsRaw === 'string' ? JSON.parse(focusDimensionsRaw) : focusDimensionsRaw;
  } catch (_) {
    errors.focusDimensions = 'focusDimensions 不是合法的 JSON';
    return { errors, focusDimensions: null };
  }
  if (!Array.isArray(focusDimensions)) {
    errors.focusDimensions = 'focusDimensions 必须是数组';
  } else {
    const invalid = focusDimensions.filter((d) => !ALLOWED_DIMENSIONS.includes(d));
    if (invalid.length > 0) {
      errors.focusDimensions = `focusDimensions 只能包含 ${ALLOWED_DIMENSIONS.join('、')}`;
    }
  }

  return { errors, focusDimensions };
}

// POST /api/diagnose - multipart/form-data
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const { taskId, designType, goal, focusDimensions: focusDimensionsRaw } = req.body;
    const file = req.file;

    // 图片校验
    if (!file) {
      throw new ApiError('IMAGE_VALIDATION_ERROR', '请上传图片文件', 400, { image: '图片文件缺失' });
    }

    // multer fileFilter 错误（格式非法）会抛 Error('IMAGE_FORMAT_INVALID')
    // fileSize 超限 multer 会自动抛 LIMIT_FILE_SIZE

    // 字段校验
    const { errors, focusDimensions } = validateFields(taskId, designType, goal, focusDimensionsRaw);
    if (Object.keys(errors).length > 0) {
      throw new ApiError('VALIDATION_ERROR', '请求参数校验失败', 400, errors);
    }

    const provider = process.env.AI_PROVIDER || 'mock';

    let report;
    if (provider === 'qwen-vl') {
      report = await diagnoseWithQwenVL({
        imageBuffer: file.buffer,
        imageMimeType: file.mimetype,
        designType,
        goal: goal || '',
        focusDimensions,
      });
    } else {
      // 默认 mock（离线测试）
      report = generateMockReport();
    }

    // 请求结束后释放内存引用（buffer 被 GC 回收）
    // file.buffer = null; // 不能直接置空，但函数结束后作用域结束，引用会被释放

    res.json({
      taskId, // 原样返回
      status: 'success',
      provider,
      report,
    });
  } catch (err) {
    // multer 错误统一处理
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError('IMAGE_VALIDATION_ERROR', '图片大小不能超过 10MB', 400, { image: '文件过大' }));
    }
    if (err.message === 'IMAGE_FORMAT_INVALID') {
      return next(new ApiError('IMAGE_VALIDATION_ERROR', '仅支持 JPG、PNG、WebP 格式', 400, { image: '格式非法' }));
    }
    next(err);
  }
});

export default router;
