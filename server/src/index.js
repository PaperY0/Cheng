import app from './app.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[diagnosis-api] 服务已启动: http://localhost:${PORT}`);
});

// 优雅退出
function shutdown(signal) {
  console.log(`\n[diagnosis-api] 收到 ${signal}，正在关闭...`);
  server.close(() => {
    console.log('[diagnosis-api] 已关闭');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
