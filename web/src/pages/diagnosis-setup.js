// 诊断设置页 - 显示任务详情 + "开始诊断"按钮
import { getTask, updateTaskStatus } from '../taskStore.js';
import { navigate } from '../router.js';
import { revealElements } from '../reveal.js';

const DESIGN_TYPE_LABELS = { ui: '界面设计', graphic: '平面设计' };
const FOCUS_LABELS = {
  layout: '排版与布局', color: '配色',
  typography: '字体与文字层级', whitespace: '留白与视觉平衡',
};

// 防重复点击
let isStarting = false;

export function renderDiagnosisSetup(taskId) {
  return `<section class="mx-auto max-w-[900px] px-6" style="padding-top:96px;padding-bottom:96px;"><div id="diagnosis-setup-content" data-task-id="${taskId}"></div></section>`;
}

function renderContent(taskId) {
  const task = getTask(taskId);

  if (!task) {
    return `
    <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
      <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:var(--secondary);">
        <i data-lucide="alert-triangle" class="w-7 h-7" style="color:var(--muted-foreground);"></i>
      </span>
      <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);">任务不存在或已过期</h1>
      <p class="mt-3 text-sm" style="color:var(--muted-foreground);">当前阶段任务仅保存在内存中，刷新页面后会丢失。请重新创建诊断任务。</p>
      <a href="/diagnosis/new" data-link="/diagnosis/new" class="mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        重新创建诊断
      </a>
    </div>`;
  }

  const created = new Date(task.createdAt).toLocaleString('zh-CN');
  const hasReport = task.status === 'success' && task.report;

  return `
  <div data-reveal class="rounded-[28px] border p-8 md:p-12" style="border-color:var(--border);background:var(--card);">
    <div class="flex items-center gap-3">
      <span class="flex h-10 w-10 items-center justify-center rounded-full" style="background:var(--secondary);">
        <i data-lucide="check-circle" class="w-5 h-5" style="color:var(--foreground);"></i>
      </span>
      <div>
        <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);letter-spacing:-0.02em;">任务已创建</h1>
        <p class="text-xs" style="color:var(--muted-foreground);">${hasReport ? '诊断已完成' : 'AI 诊断尚未开始'}</p>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      <div class="rounded-[20px] border overflow-hidden flex items-center justify-center" style="border-color:var(--border);background:var(--secondary);min-height:240px;">
        <img src="${task.image.url}" alt="待诊断设计图" class="max-w-full max-h-[320px] object-contain" />
      </div>
      <div class="flex flex-col gap-3">
        <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
          <p class="text-xs" style="color:var(--muted-foreground);">任务 ID</p>
          <p class="mt-1 text-xs break-all" style="color:var(--foreground);font-family:var(--font-mono);">${task.taskId}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
            <p class="text-xs" style="color:var(--muted-foreground);">设计类型</p>
            <p class="mt-1 text-sm" style="color:var(--foreground);font-weight:600;">${DESIGN_TYPE_LABELS[task.designType] || task.designType}</p>
          </div>
          <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
            <p class="text-xs" style="color:var(--muted-foreground);">状态</p>
            <p class="mt-1 text-sm" style="color:var(--foreground);font-weight:600;">${hasReport ? '已完成' : '草稿（待诊断）'}</p>
          </div>
        </div>
        ${task.goal ? `
        <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
          <p class="text-xs" style="color:var(--muted-foreground);">设计目标</p>
          <p class="mt-1 text-sm" style="color:var(--foreground);">${escapeHtml(task.goal)}</p>
        </div>` : ''}
        <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
          <p class="text-xs" style="color:var(--muted-foreground);">诊断重点</p>
          <div class="mt-2 flex flex-wrap gap-2">
            ${task.focusDimensions.map((d) => `<span class="rounded-full px-3 py-1 text-xs" style="background:var(--secondary);color:var(--foreground);font-weight:500;">${FOCUS_LABELS[d] || d}</span>`).join('')}
          </div>
        </div>
        <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
          <p class="text-xs" style="color:var(--muted-foreground);">创建时间</p>
          <p class="mt-1 text-sm" style="color:var(--foreground);">${created}</p>
        </div>
      </div>
    </div>

    <!-- 操作 -->
    <div class="mt-8 flex flex-wrap gap-3 justify-center">
      <a href="/diagnosis/new" data-link="/diagnosis/new" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:15px;font-weight:500;">
        重新创建诊断
      </a>
      ${hasReport ? `
      <a href="/diagnosis/${task.taskId}/report" data-link="/diagnosis/${task.taskId}/report" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        查看诊断报告
      </a>` : `
      <button type="button" id="btn-start-diagnosis" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        <i data-lucide="sparkles" class="w-4 h-4 mr-2" style="color:var(--background);"></i>开始诊断
      </button>`}
    </div>
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function mountDiagnosisSetup() {
  isStarting = false;
  const container = document.getElementById('diagnosis-setup-content');
  if (!container) return;
  const taskId = container.getAttribute('data-task-id');
  container.innerHTML = renderContent(taskId);
  if (window.lucide) window.lucide.createIcons();
  revealElements(container);

  const btn = document.getElementById('btn-start-diagnosis');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isStarting) return;
      isStarting = true;
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.pointerEvents = 'none';
      updateTaskStatus(taskId, 'processing');
      navigate(`/diagnosis/${taskId}/processing`);
    });
  }
}

export function unmountDiagnosisSetup() {
  isStarting = false;
}
