// 诊断报告页 - 完整展示 Mock 结构化报告
import { getTask, updatePreviewImage, getPreviewImages } from '../taskStore.js';

const DIMENSION_LABELS = {
  layout: '排版与布局', color: '配色',
  typography: '字体与文字层级', whitespace: '留白与视觉平衡',
};

const SEVERITY_STYLES = {
  high: { label: '高', bg: 'rgba(255,59,48,0.12)', color: '#ff3b30' },
  medium: { label: '中', bg: 'rgba(255,149,0,0.12)', color: '#ff9500' },
  low: { label: '低', bg: 'rgba(52,199,89,0.12)', color: '#34c759' },
};

export function renderDiagnosisReport(taskId) {
  const task = getTask(taskId);

  // 任务不存在
  if (!task) {
    return `
    <section class="mx-auto max-w-[800px] px-6" style="padding-top:96px;padding-bottom:96px;">
      <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
        <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:var(--secondary);">
          <i data-lucide="alert-triangle" class="w-7 h-7" style="color:var(--muted-foreground);"></i>
        </span>
        <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);">任务不存在或已过期</h1>
        <p class="mt-3 text-sm" style="color:var(--muted-foreground);">当前阶段任务仅保存在内存中，刷新页面后会丢失。请重新创建诊断任务。</p>
        <a href="/diagnosis/new" data-link="/diagnosis/new" class="mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
          重新创建诊断
        </a>
      </div>
    </section>`;
  }

  // 没有报告
  if (!task.report) {
    const failed = task.status === 'failed';
    return `
    <section class="mx-auto max-w-[800px] px-6" style="padding-top:96px;padding-bottom:96px;">
      <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
        <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:${failed ? 'rgba(255,59,48,0.12)' : 'var(--secondary)'};">
          <i data-lucide="${failed ? 'alert-circle' : 'file-question'}" class="w-7 h-7" style="color:${failed ? '#ff3b30' : 'var(--muted-foreground)'};"></i>
        </span>
        <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);">${failed ? '诊断失败' : '报告未生成'}</h1>
        <p class="mt-3 text-sm" style="color:var(--muted-foreground);">${failed ? '上次诊断未能完成，请重新诊断。' : '当前任务尚未生成诊断报告，请先执行诊断。'}</p>
        <div class="mt-8 flex flex-wrap gap-3 justify-center">
          <a href="/diagnosis/${taskId}/processing" data-link="/diagnosis/${taskId}/processing" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
            ${failed ? '重新诊断' : '前往诊断'}
          </a>
          <a href="/diagnosis/${taskId}/setup" data-link="/diagnosis/${taskId}/setup" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:15px;font-weight:500;">
            返回设置
          </a>
        </div>
      </div>
    </section>`;
  }

  // 有报告 - 完整展示
  const r = task.report;
  const s = r.summary;
  const scores = r.scores;
  const issues = r.issues || [];
  const created = new Date(r.generatedAt).toLocaleString('zh-CN');
  const provider = task.provider || 'mock';
  const isMock = provider === 'mock';
  const providerLabel = isMock ? 'Mock' : '通义千问 VL';
  const providerStyle = isMock
    ? 'background:var(--secondary);color:var(--muted-foreground);'
    : 'background:rgba(0,122,255,0.12);color:#007aff;';

  return `
  <section class="mx-auto max-w-[960px] px-6" data-task-id="${escapeAttr(taskId)}" style="padding-top:96px;padding-bottom:96px;">
    <!-- 报告头 -->
    <div data-reveal class="rounded-[28px] border p-8 md:p-10" style="border-color:var(--border);background:var(--card);">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-full" style="background:var(--secondary);">
            <i data-lucide="file-text" class="w-5 h-5" style="color:var(--foreground);"></i>
          </span>
          <div>
            <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);letter-spacing:-0.02em;">诊断报告</h1>
            <p class="text-xs" style="color:var(--muted-foreground);">生成于 ${created}</p>
          </div>
        </div>
        <span class="rounded-full px-3 py-1 text-xs" style="${providerStyle}font-weight:600;">${providerLabel}</span>
      </div>

      <!-- 总结 -->
      <div class="mt-6 rounded-[16px] border p-5" style="border-color:var(--border);background:var(--secondary);">
        <p class="text-sm" style="color:var(--foreground);font-weight:600;">${escapeHtml(s.oneLineConclusion)}</p>
        <p class="mt-2 text-xs" style="color:var(--muted-foreground);">整体状态：${escapeHtml(s.overallState)}</p>
        <div class="mt-3 flex items-center gap-2">
          <span class="text-xs" style="color:var(--muted-foreground);">置信度</span>
          <div class="h-1.5 w-24 rounded-full" style="background:var(--border);">
            <div class="h-1.5 rounded-full" style="width:${s.confidence * 100}%;background:var(--foreground);"></div>
          </div>
          <span class="text-xs" style="color:var(--foreground);font-weight:600;">${Math.round(s.confidence * 100)}%</span>
        </div>
        <p class="mt-2 text-xs" style="color:var(--muted-foreground);opacity:0.8;">${escapeHtml(s.confidenceNote)}</p>
      </div>

      <!-- 四维度评分 -->
      <div class="mt-6">
        <h2 class="mb-4 text-sm" style="color:var(--foreground);font-weight:600;">维度评分</h2>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          ${Object.entries(scores).map(([dim, score]) => {
            const pct = (score / 10) * 100;
            return `
          <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
            <p class="text-xs" style="color:var(--muted-foreground);">${DIMENSION_LABELS[dim] || dim}</p>
            <p class="mt-1" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:28px;color:var(--foreground);">${score}<span class="text-sm" style="color:var(--muted-foreground);">/10</span></p>
            <div class="mt-2 h-1.5 rounded-full" style="background:var(--border);">
              <div class="h-1.5 rounded-full" style="width:${pct}%;background:var(--foreground);"></div>
            </div>
          </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- 问题卡片 -->
    <div data-reveal class="mt-6 rounded-[28px] border p-8 md:p-10" style="border-color:var(--border);background:var(--card);">
      <h2 class="mb-2 text-sm" style="color:var(--foreground);font-weight:600;">优先问题（${r.priorities.length} 项）</h2>
      <p class="mb-6 text-xs" style="color:var(--muted-foreground);">按严重程度排序，每项包含位置、原因、建议和可执行 Prompt</p>

      <div class="flex flex-col gap-4">
        ${issues.map((issue, i) => {
          const sev = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.medium;
          return `
        <div class="rounded-[20px] border p-5" style="border-color:var(--border);background:var(--card);">
          <!-- 问题标题 -->
          <div class="flex items-start gap-3">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs" style="background:var(--foreground);color:var(--background);font-weight:700;">${i + 1}</span>
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm" style="color:var(--foreground);font-weight:600;">${escapeHtml(issue.title)}</h3>
                <span class="rounded-full px-2 py-0.5 text-xs" style="background:${sev.bg};color:${sev.color};font-weight:600;">${sev.label}</span>
                <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--secondary);color:var(--muted-foreground);">${DIMENSION_LABELS[issue.dimension] || issue.dimension}</span>
              </div>
            </div>
          </div>

          <!-- 详情 -->
          <div class="mt-4 ml-10 flex flex-col gap-3">
            <div>
              <p class="text-xs" style="color:var(--muted-foreground);">位置</p>
              <p class="mt-0.5 text-sm" style="color:var(--foreground);">${escapeHtml(issue.location)}</p>
            </div>
            <div>
              <p class="text-xs" style="color:var(--muted-foreground);">观察</p>
              <p class="mt-0.5 text-sm" style="color:var(--foreground);">${escapeHtml(issue.observation)}</p>
            </div>
            <div>
              <p class="text-xs" style="color:var(--muted-foreground);">原因</p>
              <p class="mt-0.5 text-sm" style="color:var(--foreground);">${escapeHtml(issue.reason)}</p>
            </div>
            <div>
              <p class="text-xs" style="color:var(--muted-foreground);">修改建议</p>
              <p class="mt-0.5 text-sm" style="color:var(--foreground);">${escapeHtml(issue.suggestion)}</p>
            </div>
            <div class="rounded-[12px] border p-3" style="border-color:var(--border);background:var(--secondary);">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs" style="color:var(--muted-foreground);">可执行 Prompt</p>
                <button type="button" class="btn-copy-prompt inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" data-prompt="${escapeHtml(issue.prompt)}" style="background:var(--card);color:var(--foreground);border:1px solid var(--border);">
                  <i data-lucide="copy" class="w-3 h-3"></i>复制 Prompt
                </button>
              </div>
              <p class="mt-1 text-sm" style="color:var(--foreground);">${escapeHtml(issue.prompt)}</p>
              <!-- 生成效果图按钮容器（右下角，每条 issue 独立状态） -->
              <div class="issue-gen-actions mt-2" data-issue-id="${escapeAttr(issue.id)}" data-issue-title="${escapeAttr(issue.title)}" data-issue-suggestion="${escapeAttr(issue.suggestion)}" data-issue-prompt="${escapeAttr(issue.prompt)}" style="text-align:right;">
                ${renderIssueGenButtonInner(issue.id, task)}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="book-open" class="w-3.5 h-3.5" style="color:var(--muted-foreground);"></i>
              <p class="text-xs" style="color:var(--muted-foreground);">参考原则：<span style="color:var(--foreground);font-weight:500;">${escapeHtml(issue.principle)}</span></p>
            </div>
          </div>
        </div>`;
        }).join('')}
      </div>
    </div>

    <!-- 操作 -->
    <div class="mt-6 flex flex-wrap gap-3 justify-center">
      <a href="/diagnosis/new" data-link="/diagnosis/new" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        新的诊断
      </a>
      <a href="/" data-link="/" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:15px;font-weight:500;">
        返回首页
      </a>
    </div>
  </section>`;
}

// 每条 issue 的生成效果图状态：从 task.previewImages 读取（持久化），模块级 Map 仅缓存 loading/error 临时态
// 持久化字段（task.previewImages）：{ status: 'success', imageUrl, generatedAt }
// 临时态（issueGenStates）：loading / error（不持久化）
const issueGenStates = new Map();

// 从 task.previewImages + 临时态合并出当前 issue 的完整状态
function getIssueGenState(taskId, issueId) {
  const persisted = getPreviewImages(taskId)[issueId];
  const temp = issueGenStates.get(issueId);
  // 临时态优先（loading / error 覆盖持久化的 success）
  if (temp && (temp.status === 'loading' || temp.status === 'error')) {
    return temp;
  }
  if (persisted && persisted.status === 'success') {
    return persisted;
  }
  return { status: 'idle', imageUrl: null, error: null };
}

// 渲染单条 issue 的生成按钮内部 HTML（根据状态返回不同按钮）
function renderIssueGenButtonInner(issueId, task) {
  const hasFile = task && task.image && task.image.file instanceof File;
  const taskId = task?.taskId || '';
  const state = getIssueGenState(taskId, issueId);

  // 没有原始 File：根据是否有已生成 imageUrl 决定显示
  if (!hasFile) {
    // 有可用 imageUrl：允许查看对比图，但禁止再次生成
    if (state.status === 'success' && state.imageUrl) {
      return `<button type="button" class="btn-gen-preview inline-flex h-9 min-w-[116px] items-center justify-center gap-1.5 rounded-full px-4 transition-colors" style="border:1px solid #0891b2 !important;background:#0891b2 !important;color:#ffffff !important;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">
        <i data-lucide="columns-2" class="w-3.5 h-3.5 shrink-0" style="color:#ffffff !important;"></i><span style="display:inline-block !important;color:#ffffff !important;visibility:visible !important;opacity:1 !important;">查看对比图</span>
      </button>`;
    }
    // 无 imageUrl：显示"请重新上传原图" + 返回新建诊断入口
    return `
      <div style="display:inline-flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <span class="inline-flex h-9 items-center justify-center rounded-full px-4" style="border:1px solid var(--border);background:transparent;color:var(--muted-foreground);font-size:13px;font-weight:500;">
          <i data-lucide="image-off" class="w-3.5 h-3.5 mr-1.5"></i>请重新上传原图
        </span>
        <a href="/diagnosis/new" data-link="/diagnosis/new" class="text-xs" style="color:#007aff;">返回新建诊断页面</a>
      </div>`;
  }

  switch (state.status) {
    case 'loading':
      return `<button type="button" class="btn-gen-preview inline-flex h-9 items-center justify-center rounded-full px-4" disabled style="border:1px solid var(--border);background:var(--secondary);color:var(--muted-foreground);font-size:13px;font-weight:500;cursor:not-allowed;">
        <div class="app-loading-dot"></div><div class="app-loading-dot"></div><div class="app-loading-dot"></div>
        <span class="ml-2">生成中…</span>
      </button>`;
    case 'success':
      return `<button type="button" class="btn-gen-preview inline-flex h-9 min-w-[116px] items-center justify-center gap-1.5 rounded-full px-4 transition-colors" style="border:1px solid #0891b2 !important;background:#0891b2 !important;color:#ffffff !important;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;">
        <i data-lucide="columns-2" class="w-3.5 h-3.5 shrink-0" style="color:#ffffff !important;"></i><span style="display:inline-block !important;color:#ffffff !important;visibility:visible !important;opacity:1 !important;">查看对比图</span>
      </button>`;
    case 'error':
      return `<div style="display:inline-flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <button type="button" class="btn-gen-preview inline-flex h-9 items-center justify-center rounded-full px-4 transition-colors" style="border:1px solid #ff3b30;background:transparent;color:#ff3b30;font-size:13px;font-weight:500;cursor:pointer;">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5 mr-1.5"></i>重新生成
        </button>
        <p class="text-xs" style="color:#ff3b30;max-width:320px;text-align:right;">${escapeHtml(state.error || '生成失败')}</p>
      </div>`;
    default: // idle
      return `<button type="button" class="btn-gen-preview inline-flex h-9 items-center justify-center rounded-full px-4 transition-colors" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:13px;font-weight:500;cursor:pointer;">
        <i data-lucide="sparkles" class="w-3.5 h-3.5 mr-1.5"></i>生成效果图
      </button>`;
  }
}

export function mountDiagnosisReport() {
  // 复制 Prompt 按钮（原有功能，不受影响）
  document.querySelectorAll('.btn-copy-prompt').forEach((button) => {
    button.addEventListener('click', async () => {
      const prompt = button.getAttribute('data-prompt') || '';
      try {
        await navigator.clipboard.writeText(prompt);
      } catch (_) {
        const area = document.createElement('textarea');
        area.value = prompt;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      button.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i>已复制';
      try { if (window.lucide) window.lucide.createIcons(); } catch (_) {}
      setTimeout(() => {
        if (button.isConnected) button.innerHTML = '<i data-lucide="copy" class="w-3 h-3"></i>复制 Prompt';
      }, 1600);
    });
  });

  // 生成效果图按钮（每条 issue 独立绑定）
  document.querySelectorAll('.issue-gen-actions').forEach((container) => {
    const issueId = container.getAttribute('data-issue-id') || '';
    bindIssueGenButton(container, issueId);
  });
}

// 为单个 issue 按钮容器绑定事件
function bindIssueGenButton(container, issueId) {
  const btn = container.querySelector('.btn-gen-preview');
  if (!btn) return;
  const taskId = document.querySelector('[data-task-id]')?.getAttribute('data-task-id') || '';
  const state = getIssueGenState(taskId, issueId);

  if (state.status === 'success') {
    // 查看对比图：打开弹层（使用已生成的 imageUrl）
    btn.addEventListener('click', () => {
      const issueTitle = container.getAttribute('data-issue-title') || '';
      const issueSuggestion = container.getAttribute('data-issue-suggestion') || '';
      const issuePrompt = container.getAttribute('data-issue-prompt') || '';
      openCompareModal({ issueId, issueTitle, issueSuggestion, issuePrompt, imageUrl: state.imageUrl });
    });
  } else if (state.status === 'idle' || state.status === 'error') {
    // 生成效果图 / 重新生成
    btn.addEventListener('click', () => {
      const issuePrompt = container.getAttribute('data-issue-prompt') || '';
      generatePreview(issueId, issuePrompt);
    });
  }
  // loading 状态：disabled，不绑定事件
}

// 局部更新单个 issue 的按钮（不重绘整个报告，避免页面闪烁）
function updateIssueGenButton(issueId) {
  const container = document.querySelector(`.issue-gen-actions[data-issue-id="${CSS.escape(issueId)}"]`);
  if (!container) return;
  const taskId = document.querySelector('[data-task-id]')?.getAttribute('data-task-id') || '';
  const task = getTask(taskId);
  container.innerHTML = renderIssueGenButtonInner(issueId, task);
  try { if (window.lucide) window.lucide.createIcons(); } catch (_) {}
  bindIssueGenButton(container, issueId);
}

// 调用 POST /api/generate-preview 生成效果图
async function generatePreview(issueId, prompt) {
  const taskId = document.querySelector('[data-task-id]')?.getAttribute('data-task-id') || '';

  // 防止重复请求
  const currentState = getIssueGenState(taskId, issueId);
  if (currentState.status === 'loading') return;

  const task = getTask(taskId);

  // 没有原始 File：不发请求，显示错误
  if (!task || !task.image || !(task.image.file instanceof File)) {
    issueGenStates.set(issueId, { status: 'error', imageUrl: null, error: '原图文件不存在，请重新上传原图' });
    updateIssueGenButton(issueId);
    return;
  }

  // 进入 loading（临时态，不写 taskStore）
  issueGenStates.set(issueId, { status: 'loading', imageUrl: null, error: null });
  updateIssueGenButton(issueId);

  try {
    const formData = new FormData();
    formData.append('image', task.image.file); // 原始 File，不是 blob URL
    formData.append('taskId', task.taskId || '');
    formData.append('issueId', issueId);
    formData.append('prompt', prompt);
    formData.append('designType', task.designType || 'ui');
    if (task.goal) formData.append('goal', task.goal);

    const res = await fetch('/api/generate-preview', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      const msg = mapErrorMessage(res.status, data);
      issueGenStates.set(issueId, { status: 'error', imageUrl: null, error: msg });
      updateIssueGenButton(issueId);
      return;
    }

    // 成功：写回 taskStore（持久化）+ 清除临时态
    updatePreviewImage(taskId, issueId, {
      status: 'success',
      imageUrl: data.image.url,
      generatedAt: new Date().toISOString(),
    });
    issueGenStates.delete(issueId); // 清除临时态，恢复使用持久化数据
    updateIssueGenButton(issueId);
  } catch (err) {
    issueGenStates.set(issueId, { status: 'error', imageUrl: null, error: err.message || '网络错误，请检查后端服务' });
    updateIssueGenButton(issueId);
  }
}

// 错误消息映射（按 HTTP 状态码和错误码返回对应中文）
function mapErrorMessage(status, data) {
  const msg = data?.error?.message || '';
  // API key / 配置错误
  if (status === 500 && /API Key|Key|配置/i.test(msg)) {
    return '生图服务配置错误，请检查服务端 Key';
  }
  // 超时
  if (status === 504) {
    return '效果图生成超时，请稍后重试';
  }
  // 限流
  if (status === 429) {
    return '当前请求较多，请稍后重试';
  }
  // 服务未开启
  if (status === 503) {
    return msg || '生图服务未开启';
  }
  return msg || `生成失败（HTTP ${status}）`;
}

// ===== 对比弹层（第 4 步实现，第 3 步改为接收已生成的 imageUrl）=====

let compareModalEl = null;
let compareEscHandler = null;

function openCompareModal({ issueId, issueTitle, issueSuggestion, issuePrompt, imageUrl }) {
  // 先关闭已有弹层
  closeCompareModal();

  // 获取原图 URL
  const taskId = document.querySelector('[data-task-id]')?.getAttribute('data-task-id') || '';
  const task = getTask(taskId);
  const originalUrl = task?.image?.url || '';

  const overlay = document.createElement('div');
  overlay.className = 'compare-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '原图与效果图对比');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999',
    'background:rgba(15,23,42,0.28)',
    'backdrop-filter:blur(22px) saturate(135%)',
    '-webkit-backdrop-filter:blur(22px) saturate(135%)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'padding:24px', 'overflow-y:auto',
  ].join(';');

  const dialog = document.createElement('div');
  dialog.className = 'compare-dialog';
  dialog.style.cssText = [
    'position:relative', 'width:100%', 'max-width:1100px',
    'max-height:90vh', 'overflow-y:auto',
    'border-radius:30px',
    'border:1px solid rgba(255,255,255,0.72)',
    'background:rgba(255,255,255,0.62)',
    'backdrop-filter:blur(34px) saturate(165%)',
    '-webkit-backdrop-filter:blur(34px) saturate(165%)',
    'box-shadow:0 30px 90px rgba(15,23,42,0.22), inset 0 1px 0 rgba(255,255,255,0.82)',
    'padding:28px',
  ].join(';');

  dialog.innerHTML = `
    <button type="button" class="compare-close" aria-label="关闭" style="position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.8);background:rgba(255,255,255,0.58);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:var(--foreground);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1;box-shadow:0 8px 22px rgba(15,23,42,0.12);">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>

    <h3 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:20px;color:var(--foreground);letter-spacing:-0.02em;padding-right:40px;">${escapeHtml(issueTitle)}</h3>

    <div class="mt-3 rounded-[12px] border p-3" style="border-color:var(--border);background:var(--secondary);">
      <p class="text-xs" style="color:var(--muted-foreground);">当前修改建议</p>
      <p class="mt-1 text-sm" style="color:var(--foreground);">${escapeHtml(issueSuggestion)}</p>
    </div>

    <div class="mt-3 rounded-[12px] border p-3" style="border-color:var(--border);background:var(--secondary);">
      <p class="text-xs" style="color:var(--muted-foreground);">当前 Prompt</p>
      <p class="mt-1 text-sm" style="color:var(--foreground);">${escapeHtml(issuePrompt)}</p>
    </div>

    <div class="compare-grid" style="display:grid;grid-template-columns:1fr;gap:16px;margin-top:20px;">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <p class="text-sm" style="color:var(--foreground);font-weight:600;">修改前</p>
        <div class="compare-img-box" data-side="original" style="position:relative;border-radius:20px;border:1px solid rgba(255,255,255,0.7);background:rgba(255,255,255,0.38);box-shadow:inset 0 1px 0 rgba(255,255,255,0.75);min-height:200px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          ${originalUrl
            ? `<img src="${escapeAttr(originalUrl)}" alt="原始设计图" style="max-width:100%;max-height:480px;object-fit:contain;display:block;" />`
            : `<div style="text-align:center;padding:24px;"><i data-lucide="image-off" class="w-8 h-8 mx-auto" style="color:var(--muted-foreground);"></i><p class="mt-2 text-xs" style="color:var(--muted-foreground);">原图不存在或已失效</p></div>`}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <p class="text-sm" style="color:var(--foreground);font-weight:600;">建议执行后</p>
        <div class="compare-img-box" data-side="generated" style="position:relative;border-radius:20px;border:1px solid rgba(255,255,255,0.7);background:rgba(255,255,255,0.38);box-shadow:inset 0 1px 0 rgba(255,255,255,0.75);min-height:200px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          <div class="compare-loading" style="text-align:center;padding:24px;">
            <div class="app-loading-dot"></div><div class="app-loading-dot"></div><div class="app-loading-dot"></div>
            <p class="mt-2 text-xs" style="color:var(--muted-foreground);">正在加载效果图...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  compareModalEl = overlay;

  applyResponsiveGrid();
  try { if (window.lucide) window.lucide.createIcons(); } catch (_) {}

  dialog.querySelector('.compare-close').addEventListener('click', closeCompareModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCompareModal();
  });
  compareEscHandler = (e) => {
    if (e.key === 'Escape') closeCompareModal();
  };
  document.addEventListener('keydown', compareEscHandler);

  // 用已生成的 imageUrl 渲染效果图（不再调用 API）
  const genBox = dialog.querySelector('[data-side="generated"]');
  renderGeneratedImage(genBox, imageUrl, issueId, issuePrompt);
}

function applyResponsiveGrid() {
  if (!compareModalEl) return;
  const grid = compareModalEl.querySelector('.compare-grid');
  if (!grid) return;
  if (window.matchMedia('(min-width: 768px)').matches) {
    grid.style.gridTemplateColumns = '1fr 1fr';
  } else {
    grid.style.gridTemplateColumns = '1fr';
  }
}

// 渲染效果图到弹层右侧（含加载失败状态和重新生成入口）
function renderGeneratedImage(box, url, issueId, issuePrompt) {
  if (!url) {
    box.innerHTML = `<div style="text-align:center;padding:24px;"><i data-lucide="image-off" class="w-8 h-8 mx-auto" style="color:var(--muted-foreground);"></i><p class="mt-2 text-xs" style="color:var(--muted-foreground);">效果图未生成</p></div>`;
    try { if (window.lucide) window.lucide.createIcons(); } catch (_) {}
    return;
  }

  box.innerHTML = '';
  const img = document.createElement('img');
  img.alt = '建议执行后效果图';
  img.style.cssText = 'max-width:100%;max-height:480px;object-fit:contain;display:block;';
  img.addEventListener('error', () => {
    img.remove();
    // 检查是否有原始 File 决定能否重新生成
    const taskId = document.querySelector('[data-task-id]')?.getAttribute('data-task-id') || '';
    const task = getTask(taskId);
    const canRegen = task && task.image && task.image.file instanceof File;
    const regenBtnHtml = canRegen
      ? `<button type="button" class="compare-regen" style="margin-top:12px;height:36px;border-radius:18px;padding:0 18px;border:1px solid var(--border);background:var(--foreground);color:var(--background);font-size:13px;font-weight:600;cursor:pointer;">重新生成</button>`
      : `<p class="mt-2 text-xs" style="color:var(--muted-foreground);">原图文件已失效，请重新上传原图后生成</p>`;
    box.innerHTML = `
      <div style="text-align:center;padding:24px;">
        <i data-lucide="alert-circle" class="w-8 h-8 mx-auto" style="color:#ff3b30;"></i>
        <p class="mt-2 text-xs" style="color:#ff3b30;">效果图已失效，请重新生成</p>
        ${regenBtnHtml}
      </div>`;
    try { if (window.lucide) window.lucide.createIcons(); } catch (_) {}
    if (canRegen) {
      const regenBtn = box.querySelector('.compare-regen');
      if (regenBtn) {
        regenBtn.addEventListener('click', () => {
          closeCompareModal();
          // 重置该 issue 状态为 idle 并触发生成
          issueGenStates.set(issueId, { status: 'idle', imageUrl: null, error: null });
          updateIssueGenButton(issueId);
          generatePreview(issueId, issuePrompt);
        });
      }
    }
  });
  img.src = url;
  box.appendChild(img);
}

function closeCompareModal() {
  if (compareEscHandler) {
    document.removeEventListener('keydown', compareEscHandler);
    compareEscHandler = null;
  }
  if (compareModalEl && compareModalEl.parentNode) {
    compareModalEl.parentNode.removeChild(compareModalEl);
  }
  compareModalEl = null;
}

export function unmountDiagnosisReport() {
  // 关闭弹层（清除 ESC 监听 + 移除 DOM）
  closeCompareModal();
  // 清除临时态（loading/error），持久化 success 状态保留在 taskStore
  // 避免离开再返回时残留旧的 loading/error
  issueGenStates.clear();
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
