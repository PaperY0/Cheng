// 诊断处理页 - 阶段性状态 + 调用 POST /api/diagnose
import { getTask, updateTaskStatus, updateTaskReport, saveRecentDiagnosis } from '../taskStore.js';
import { navigate } from '../router.js';
import { revealElements } from '../reveal.js';

const STAGES = [
  { key: 'read', label: '正在读取任务', icon: 'file-search' },
  { key: 'layout', label: '正在检查排版', icon: 'layout-grid' },
  { key: 'color', label: '正在分析配色', icon: 'palette' },
  { key: 'typography', label: '正在分析字体', icon: 'type' },
  { key: 'suggestion', label: '正在整理建议', icon: 'lightbulb' },
];

// 防止重复调用
let apiCalled = false;
let stageTimer = null;
let currentStageIndex = 0;

export function renderDiagnosisProcessing(taskId) {
  return `<section class="mx-auto max-w-[800px] px-6" style="padding-top:96px;padding-bottom:96px;"><div id="diagnosis-processing-content" data-task-id="${taskId}"></div></section>`;
}

function renderContent(taskId, error) {
  const task = getTask(taskId);

  // 任务不存在
  if (!task) {
    return `
    <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
      <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:var(--secondary);">
        <i data-lucide="alert-triangle" class="w-7 h-7" style="color:var(--muted-foreground);"></i>
      </span>
      <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);">任务不存在或已过期</h1>
      <p class="mt-3 text-sm" style="color:var(--muted-foreground);">请重新创建诊断任务。</p>
      <a href="/diagnosis/new" data-link="/diagnosis/new" class="mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        重新创建诊断
      </a>
    </div>`;
  }

  // 错误状态
  if (error) {
    return `
    <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
      <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:rgba(255,59,48,0.12);">
        <i data-lucide="alert-circle" class="w-7 h-7" style="color:#ff3b30;"></i>
      </span>
      <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);">诊断失败</h1>
      <p class="mt-3 text-sm" style="color:#ff3b30;">${escapeHtml(error)}</p>
      <div class="mt-6 rounded-[16px] border p-4 text-left" style="border-color:var(--border);background:var(--secondary);">
        <p class="text-xs" style="color:var(--muted-foreground);">任务和图片信息已保留，可以重新诊断。</p>
      </div>
      <div class="mt-8 flex flex-wrap gap-3 justify-center">
        <button type="button" id="btn-retry" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
          <i data-lucide="refresh-cw" class="w-4 h-4 mr-2" style="color:var(--background);"></i>重新诊断
        </button>
        <a href="/diagnosis/${taskId}/setup" data-link="/diagnosis/${taskId}/setup" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:15px;font-weight:500;">
          返回设置
        </a>
      </div>
    </div>`;
  }

  // 处理中状态 - 阶段性进度
  return `
  <div data-reveal class="rounded-[28px] border p-8 md:p-12" style="border-color:var(--border);background:var(--card);">
    <div class="flex items-center gap-3">
      <span class="flex h-10 w-10 items-center justify-center rounded-full" style="background:var(--secondary);">
        <div class="app-loading-dot"></div><div class="app-loading-dot"></div><div class="app-loading-dot"></div>
      </span>
      <div>
        <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);letter-spacing:-0.02em;">正在诊断</h1>
        <p class="text-xs" style="color:var(--muted-foreground);">AI 正在分析你的设计图</p>
      </div>
    </div>

    <!-- 图片预览（小） -->
    <div class="mt-6 rounded-[16px] border overflow-hidden flex items-center justify-center" style="border-color:var(--border);background:var(--secondary);max-height:160px;">
      <img src="${task.image.url}" alt="诊断中" class="max-w-full max-h-[160px] object-contain opacity-80" />
    </div>

    <!-- 阶段列表 -->
    <div class="mt-6 flex flex-col gap-3" id="stage-list">
      ${STAGES.map((stage, i) => `
      <div class="flex items-center gap-3 rounded-[12px] border p-3" data-stage="${i}" style="border-color:var(--border);background:${i <= currentStageIndex ? 'var(--secondary)' : 'transparent'};opacity:${i <= currentStageIndex ? '1' : '0.4'};">
        <span data-stage-icon class="flex h-8 w-8 items-center justify-center rounded-full" style="background:${i < currentStageIndex ? 'var(--foreground)' : 'var(--secondary)'};">
          ${i < currentStageIndex
            ? '<i data-lucide="check" class="w-4 h-4" style="color:var(--background);"></i>'
            : i === currentStageIndex
            ? '<div class="app-loading-dot"></div>'
            : '<i data-lucide="' + stage.icon + '" class="w-4 h-4" style="color:var(--muted-foreground);"></i>'}
        </span>
        <span data-stage-label class="text-sm" style="color:${i <= currentStageIndex ? 'var(--foreground)' : 'var(--muted-foreground)'};font-weight:${i === currentStageIndex ? '600' : '400'};">${stage.label}</span>
      </div>`).join('')}
    </div>
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// 调用诊断 API - multipart/form-data 上传图片
async function callDiagnoseApi(task) {
  const formData = new FormData();
  formData.append('image', task.image.file); // 原始 File
  formData.append('taskId', task.taskId);
  formData.append('designType', task.designType);
  formData.append('goal', task.goal || '');
  formData.append('focusDimensions', JSON.stringify(task.focusDimensions));

  const res = await fetch('/api/diagnose', {
    method: 'POST',
    body: formData, // 不设 Content-Type，让浏览器自动生成 multipart boundary
  });

  if (!res.ok) {
    let msg = `请求失败（HTTP ${res.status}）`;
    try {
      const data = await res.json();
      if (data.error && data.error.message) msg = data.error.message;
    } catch (_) {}
    throw new Error(msg);
  }

  return res.json();
}

function rerender(taskId, error) {
  const container = document.getElementById('diagnosis-processing-content');
  if (!container) return;
  container.innerHTML = renderContent(taskId, error);
  if (window.lucide) window.lucide.createIcons();
  revealElements(container);

  // 重试按钮
  const btnRetry = document.getElementById('btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', (e) => {
      e.preventDefault();
      apiCalled = false;
      currentStageIndex = 0;
      startProcessing(taskId);
    });
  }
}

// 只更新阶段行，避免每 800ms 重建整张卡片造成闪烁和动画重置。
function updateStageView() {
  document.querySelectorAll('#stage-list [data-stage]').forEach((row, i) => {
    const active = i <= currentStageIndex;
    const current = i === currentStageIndex;
    row.style.background = active ? 'var(--secondary)' : 'transparent';
    row.style.opacity = active ? '1' : '0.4';
    const label = row.querySelector('[data-stage-label]');
    if (label) {
      label.style.color = active ? 'var(--foreground)' : 'var(--muted-foreground)';
      label.style.fontWeight = current ? '600' : '400';
    }
    const icon = row.querySelector('[data-stage-icon]');
    if (icon) {
      icon.style.background = i < currentStageIndex ? 'var(--foreground)' : 'var(--secondary)';
      icon.innerHTML = i < currentStageIndex
        ? '<span style="color:var(--background);font-size:18px;">✓</span>'
        : current
          ? '<div class="app-loading-dot"></div>'
          : `<i data-lucide="${STAGES[i].icon}" class="w-4 h-4" style="color:var(--muted-foreground);"></i>`;
    }
  });
  try { if (window.lucide) window.lucide.createIcons(); } catch (_) {}
}

function startProcessing(taskId) {
  const task = getTask(taskId);
  if (!task) {
    rerender(taskId, '任务不存在');
    return;
  }

  // 如果已有报告，直接跳转
  if (task.status === 'success' && task.report) {
    navigate(`/diagnosis/${taskId}/report`);
    return;
  }

  // 防止重复调用
  if (apiCalled) return;
  apiCalled = true;

  // 阶段动画
  currentStageIndex = 0;
  rerender(taskId);
  stageTimer = setInterval(() => {
    currentStageIndex++;
    if (currentStageIndex < STAGES.length) {
      updateStageView();
    } else {
      clearInterval(stageTimer);
      stageTimer = null;
    }
  }, 800);

  // 调用 API
  callDiagnoseApi(task)
    .then((data) => {
      if (stageTimer) { clearInterval(stageTimer); stageTimer = null; }
      updateTaskReport(taskId, data.report, data.provider);
      updateTaskStatus(taskId, 'success');
      saveRecentDiagnosis(getTask(taskId));
      navigate(`/diagnosis/${taskId}/report`);
    })
    .catch((err) => {
      if (stageTimer) { clearInterval(stageTimer); stageTimer = null; }
      updateTaskStatus(taskId, 'failed');
      rerender(taskId, err.message || '网络错误，请检查后端服务是否启动');
    });
}

export function mountDiagnosisProcessing() {
  apiCalled = false;
  currentStageIndex = 0;
  const container = document.getElementById('diagnosis-processing-content');
  if (!container) return;
  const taskId = container.getAttribute('data-task-id');
  startProcessing(taskId);
}

export function unmountDiagnosisProcessing() {
  if (stageTimer) { clearInterval(stageTimer); stageTimer = null; }
  apiCalled = false;
  currentStageIndex = 0;
}
