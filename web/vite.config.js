import { defineConfig } from 'vite';

export default defineConfig({
  // SPA 动态路由刷新必须配置在顶层，server.appType 不会被 Vite 识别
  appType: 'spa',
  server: {
    port: 5173,
    proxy: {
      // 代理后端 API，不写死 API Key
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
