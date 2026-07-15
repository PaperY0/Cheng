// 自定义业务错误
export class ApiError extends Error {
  constructor(code, message, status = 500, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

// 404 处理
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `请求的资源不存在: ${req.path}`,
    },
  });
}

// 统一错误处理中间件
export function errorHandler(err, _req, res, _next) {
  // multer 文件格式错误（fileFilter 抛出的自定义错误）
  if (err.message === 'IMAGE_FORMAT_INVALID') {
    return res.status(400).json({
      error: {
        code: 'IMAGE_VALIDATION_ERROR',
        message: '仅支持 JPG、PNG、WebP 格式',
        fields: { image: '格式非法' },
      },
    });
  }

  // multer 文件大小超限
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        code: 'IMAGE_VALIDATION_ERROR',
        message: '图片大小不能超过 10MB',
        fields: { image: '文件过大' },
      },
    });
  }

  // JSON 解析错误（请求体非合法 JSON）
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: '请求体不是合法的 JSON',
      },
    });
  }

  // CORS 来源拒绝
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({
      error: {
        code: 'CORS_ERROR',
        message: err.message,
      },
    });
  }

  // 自定义业务错误
  if (err instanceof ApiError) {
    const body = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    if (err.code === 'VALIDATION_ERROR') {
      body.error.fields = err.fields;
    }
    return res.status(err.status).json(body);
  }

  // 未知错误
  console.error('[diagnosis-api] 未处理错误:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
  });
}
