import { matchRoute, currentPath } from './router.js';
import { renderPage, bindLinkClicks, syncNavPill } from './shell.js';
import { renderHome } from './pages/home.js';
import { renderDiagnosisNew, mountDiagnosisNew, unmountDiagnosisNew } from './pages/diagnosis-new.js';
import { renderDiagnosisSetup, mountDiagnosisSetup, unmountDiagnosisSetup } from './pages/diagnosis-setup.js';
import { renderDiagnosisProcessing, mountDiagnosisProcessing, unmountDiagnosisProcessing } from './pages/diagnosis-processing.js';
import { renderDiagnosisReport, mountDiagnosisReport, unmountDiagnosisReport } from './pages/diagnosis-report.js';
import { renderCompare, renderNotFound } from './pages/placeholder.js';
import { renderHistory } from './pages/history.js';
import { renderProfile, mountProfile, unmountProfile } from './pages/profile.js';
import { mountHistory, unmountHistory } from './pages/history.js';
import { renderTraining, mountTraining, unmountTraining, renderTrainingCompare, mountTrainingCompare, unmountTrainingCompare } from './pages/training.js';
import { renderTrainingSpot, mountTrainingSpot, unmountTrainingSpot } from './pages/training-spot.js';
import { renderTrainingScoring, mountTrainingScoring, unmountTrainingScoring } from './pages/training-scoring.js';
import { releaseTaskImage, clearTask } from './taskStore.js';
import { revealElements } from './reveal.js';

const app = document.getElementById('app');

// 在少数生产浏览器中，Vite 的 module 入口可能被下载却没有执行。
// index.html 会在短暂等待后用普通 script 重试同一构建文件；此锁确保
// 即使两个入口最终都执行，应用也只初始化一次。
if (!window.__meishangAppStarted) {
window.__meishangAppStarted = true;
window.__meishangAppMounted = true;

let currentUnmount = null;
let currentRouteName = '';

const DIAGNOSIS_FLOW = new Set([
  'diagnosis-new',
  'diagnosis-setup',
  'diagnosis-processing',
  'diagnosis-report',
  'diagnosis-compare',
]);

const pageRegistry = {
  'diagnosis-new': { mount: mountDiagnosisNew, unmount: unmountDiagnosisNew },
  'diagnosis-setup': { mount: mountDiagnosisSetup, unmount: unmountDiagnosisSetup },
  'diagnosis-processing': { mount: mountDiagnosisProcessing, unmount: unmountDiagnosisProcessing },
  'diagnosis-report': { mount: mountDiagnosisReport, unmount: unmountDiagnosisReport },
  'training': { mount: mountTraining, unmount: unmountTraining },
  'training-compare': { mount: mountTrainingCompare, unmount: unmountTrainingCompare },
  'training-spot': { mount: mountTrainingSpot, unmount: unmountTrainingSpot },
  'training-scoring': { mount: mountTrainingScoring, unmount: unmountTrainingScoring },
  'profile': { mount: mountProfile, unmount: unmountProfile },
  'history': { mount: mountHistory, unmount: unmountHistory },
};

function render() {
  const path = currentPath();
  const { name: nextRouteName, params } = matchRoute(path);
  const previousRouteName = currentRouteName;

  if (currentUnmount) {
    currentUnmount();
    currentUnmount = null;
  }

  const wasInFlow = DIAGNOSIS_FLOW.has(previousRouteName);
  const isInFlow = DIAGNOSIS_FLOW.has(nextRouteName);
  if (wasInFlow && !isInFlow) {
    releaseTaskImage();
    clearTask();
  }

  currentRouteName = nextRouteName;

  let activeKey = '';
  let content = '';
  let renderFailed = false;

  try {
    switch (nextRouteName) {
      case 'home':
        activeKey = '';
        content = renderHome();
        break;
      case 'diagnosis-new':
        activeKey = 'diagnosis';
        content = renderDiagnosisNew();
        break;
      case 'history':
        activeKey = '';
        content = renderHistory();
        break;
      case 'profile':
        activeKey = 'profile';
        content = renderProfile();
        break;
      case 'training':
        activeKey = 'training';
        content = renderTraining();
        break;
      case 'training-compare':
        activeKey = 'training';
        content = renderTrainingCompare();
        break;
      case 'training-spot':
        activeKey = 'training';
        content = renderTrainingSpot();
        break;
      case 'training-scoring':
        activeKey = 'training';
        content = renderTrainingScoring();
        break;
      case 'diagnosis-setup':
        activeKey = 'diagnosis';
        content = renderDiagnosisSetup(params.taskId);
        break;
      case 'diagnosis-processing':
        activeKey = 'diagnosis';
        content = renderDiagnosisProcessing(params.taskId);
        break;
      case 'diagnosis-report':
        activeKey = 'diagnosis';
        content = renderDiagnosisReport(params.taskId);
        break;
      case 'diagnosis-compare':
        activeKey = 'diagnosis';
        content = renderCompare(params.taskId);
        break;
      case 'not-found':
      default:
        activeKey = '';
        content = renderNotFound(path);
        break;
    }
  } catch (error) {
    renderFailed = true;
    console.error('[page-content-render-error]', error);
    content = renderPageError('页面内容加载失败，请刷新后重试');
  }

  app.innerHTML = renderPage(activeKey, content);

  // 渲染顺序：先生成静态壳 → 执行 mount（mount 内部会 rerender 动态插入 data-reveal）
  // → mount 完成后再执行 afterRender，确保动态插入的元素也被扫描到
  const entry = renderFailed ? null : pageRegistry[nextRouteName];
  try {
    if (entry && entry.mount) {
      entry.mount();
    }
    currentUnmount = (entry && entry.unmount) || null;
    afterRender();
  } catch (error) {
    // mount 抛错：保留错误信息到 Console，显示统一错误卡片，避免白屏
    console.error('[page-render-error]', error);
    currentUnmount = null;
    app.innerHTML = renderPage(activeKey, renderPageError('页面加载失败，请刷新后重试'));
    afterRender();
  }
}

// 统一错误卡片：不依赖 data-reveal，避免再次进入 opacity:0 死循环
function renderPageError(message) {
  const safe = String(message || '页面加载失败，请刷新后重试')
    .replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  return `
  <section class="mx-auto max-w-[800px] px-6" style="padding-top:96px;padding-bottom:96px;">
    <div class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
      <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:rgba(255,59,48,0.12);">
        <span style="color:#ff3b30;font-size:28px;font-weight:700;">!</span>
      </span>
      <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);letter-spacing:-0.02em;margin-top:24px;">页面加载失败</h1>
      <p style="margin-top:12px;font-size:14px;color:var(--muted-foreground);">${safe}</p>
      <a href="/" data-link="/" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="margin-top:32px;background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">返回首页</a>
    </div>
  </section>`;
}

function afterRender() {
  // 图标渲染：失败不阻塞页面主体内容
  try {
    if (window.lucide) window.lucide.createIcons();
  } catch (_) {
    // 忽略图标渲染异常，不影响内容展示
  }

  // 滚动揭示动画：任何异常都降级为立即显示，绝不阻断渲染
  revealElements(document);
  syncNavPill();
  window.scrollTo(0, 0);
}

function init() {
  bindLinkClicks();
  window.addEventListener('popstate', render);
  render();
}

init();
}
