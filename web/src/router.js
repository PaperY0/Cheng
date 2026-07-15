// 极简哈希路由器：支持动态路由、浏览器刷新、前进后退
export const routes = [
  { pattern: /^\/$/, name: 'home' },
  { pattern: /^\/diagnosis\/new$/, name: 'diagnosis-new' },
  { pattern: /^\/history$/, name: 'history' },
  { pattern: /^\/profile$/, name: 'profile' },
  { pattern: /^\/training$/, name: 'training' },
  { pattern: /^\/training\/compare$/, name: 'training-compare' },
  { pattern: /^\/training\/spot$/, name: 'training-spot' },
  { pattern: /^\/training\/scoring$/, name: 'training-scoring' },
  { pattern: /^\/diagnosis\/([^/]+)\/setup$/, name: 'diagnosis-setup', param: 'taskId' },
  { pattern: /^\/diagnosis\/([^/]+)\/processing$/, name: 'diagnosis-processing', param: 'taskId' },
  { pattern: /^\/diagnosis\/([^/]+)\/report$/, name: 'diagnosis-report', param: 'taskId' },
  { pattern: /^\/diagnosis\/([^/]+)\/compare$/, name: 'diagnosis-compare', param: 'taskId' },
];

// 解析当前路径，返回匹配的路由名和参数
export function matchRoute(path) {
  for (const route of routes) {
    const m = path.match(route.pattern);
    if (m) {
      const params = {};
      if (route.param) params[route.param] = decodeURIComponent(m[1]);
      return { name: route.name, params };
    }
  }
  return { name: 'not-found', params: {} };
}

// 导航到指定路径（不刷新页面）
export function navigate(path) {
  if (location.pathname === path) return;
  history.pushState({}, '', path);
  dispatchEvent(new PopStateEvent('popstate'));
}

// 获取当前路径
export function currentPath() {
  return location.pathname;
}
