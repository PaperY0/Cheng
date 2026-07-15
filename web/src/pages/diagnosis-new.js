// 新建诊断页 - 图片上传与校验 + 诊断配置表单 + 本地任务创建
// 状态仅在模块内存中保存，刷新即重置

import { setTask, generateTaskId, getRecentDiagnoses } from '../taskStore.js';
import { navigate } from '../router.js';
import { revealElements } from '../reveal.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const DESIGN_TYPES = [
  { value: 'ui', label: '界面设计' },
  { value: 'graphic', label: '平面设计' },
];

const FOCUS_DIMENSIONS = [
  { value: 'layout', label: '排版与布局' },
  { value: 'color', label: '配色' },
  { value: 'typography', label: '字体与文字层级' },
  { value: 'whitespace', label: '留白与视觉平衡' },
];

// 模块级状态（不持久化）
const state = {
  status: 'idle', // idle | loading | success | error
  error: '',
  image: null, // { name, size, type, width, height, url }
  // 配置表单状态
  designType: '', // '' | 'ui' | 'graphic'
  goal: '', // 可选字符串
  focusDimensions: ['layout', 'color', 'typography', 'whitespace'], // 默认全选
  formError: '', // 表单校验错误
};

// 当前 object URL 引用，便于释放
let currentObjectUrl = null;
// 粘贴监听引用，便于卸载
let pasteHandler = null;

// 释放当前 object URL，避免内存泄漏
function releaseObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// 校验文件类型与大小
function validateFile(file) {
  if (!file) return '未选择文件';
  const typeOk = ALLOWED_TYPES.includes(file.type);
  const extOk = ALLOWED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!typeOk && !extOk) {
    return '仅支持 JPG、PNG、WebP 格式';
  }
  if (file.size > MAX_SIZE) {
    return '图片大小不能超过 10MB（当前 ' + formatSize(file.size) + '）';
  }
  if (file.size === 0) {
    return '图片文件为空，请重新选择';
  }
  return '';
}

// 处理图片文件：校验 → 读取尺寸 → 更新状态 → 重渲染
function handleFile(file) {
  // 边界修复：无论校验是否通过，先释放旧 object URL，避免泄漏
  releaseObjectUrl();

  // 进入 loading
  state.status = 'loading';
  state.error = '';
  state.image = null;
  // 重置表单（新图片，旧配置失效）
  state.designType = '';
  state.goal = '';
  state.focusDimensions = ['layout', 'color', 'typography', 'whitespace'];
  state.formError = '';
  rerender();

  const err = validateFile(file);
  if (err) {
    state.status = 'error';
    state.error = err;
    rerender();
    return;
  }

  const url = URL.createObjectURL(file);
  currentObjectUrl = url;

  const img = new Image();
  img.onload = () => {
    state.status = 'success';
    state.image = {
      name: file.name,
      size: file.size,
      type: file.type || 'image/unknown',
      width: img.naturalWidth,
      height: img.naturalHeight,
      url: url,
      file: file, // 保留原始 File 引用，供 processing 页面发送给后端（不持久化）
    };
    rerender();
  };
  img.onerror = () => {
    releaseObjectUrl();
    state.status = 'error';
    state.error = '图片无法读取，请确认文件未损坏后重新选择';
    rerender();
  };
  img.src = url;
}

// 删除图片，恢复未上传状态
function handleDelete() {
  releaseObjectUrl();
  state.status = 'idle';
  state.error = '';
  state.image = null;
  state.designType = '';
  state.goal = '';
  state.focusDimensions = ['layout', 'color', 'typography', 'whitespace'];
  state.formError = '';
  rerender();
}

// 表单：选择设计类型
function selectDesignType(value) {
  state.designType = value;
  state.formError = '';
  document.querySelectorAll('input[name="designType"]').forEach((input) => {
    const selected = input.value === value;
    input.checked = selected;
    syncChoiceVisual(input, selected);
  });
}

// 表单：输入设计目标
function inputGoal(value) {
  state.goal = value;
}

// 表单：切换诊断重点
function toggleFocusDimension(value) {
  const input = document.querySelector(`input[name="focusDimensions"][value="${value}"]`);
  const selected = Boolean(input && input.checked);
  state.focusDimensions = selected
    ? [...new Set([...state.focusDimensions, value])]
    : state.focusDimensions.filter((item) => item !== value);
  state.formError = '';
  if (input) syncChoiceVisual(input, selected);
}

// 只同步当前选项的视觉状态，避免选择时重绘整个表单造成闪烁和焦点丢失。
function syncChoiceVisual(input, selected) {
  const label = input.closest('label');
  if (!label) return;

  label.style.borderColor = selected ? 'var(--foreground)' : 'var(--border)';
  label.style.background = selected ? 'var(--secondary)' : 'var(--card)';
  label.style.borderWidth = selected ? '2px' : '1px';
  label.classList.toggle('hover:bg-[var(--secondary)]', !selected);
  label.setAttribute('aria-checked', String(selected));

  const indicator = label.querySelector('[data-choice-indicator]');
  if (!indicator) return;
  if (input.type === 'radio') {
  indicator.dataset.selected = String(selected);
  indicator.dataset.choiceType = input.type;
  indicator.style.borderColor = selected ? 'var(--foreground)' : 'var(--border)';
    indicator.innerHTML = selected
      ? '<span class="h-2.5 w-2.5 rounded-full" style="background:var(--foreground);"></span>'
      : '';
  } else {
    indicator.style.borderColor = selected ? 'var(--foreground)' : 'var(--border)';
    indicator.style.background = selected ? 'var(--foreground)' : 'transparent';
    indicator.innerHTML = selected
      ? '<span aria-hidden="true" style="color:var(--background);font-size:12px;line-height:1;">✓</span>'
      : '';
  }
}

// 创建任务
function handleCreateTask() {
  // 校验
  if (!state.designType) {
    state.formError = '请选择设计类型';
    rerender();
    return;
  }
  if (state.focusDimensions.length === 0) {
    state.formError = '至少保留一个诊断重点';
    rerender();
    return;
  }

  const task = {
    taskId: generateTaskId(),
    image: { ...state.image },
    designType: state.designType,
    goal: state.goal.trim(),
    focusDimensions: [...state.focusDimensions],
    createdAt: new Date().toISOString(),
    status: 'draft',
  };

  setTask(task);
  // URL 责任转交给 taskStore：清空本地引用，不释放（setup 页面需要显示）
  // 后续由 main.js 跨流程判断时调用 taskStore.releaseTaskImage 释放
  currentObjectUrl = null;
  navigate(`/diagnosis/${task.taskId}/setup`);
}

// 渲染并重新绑定事件
function rerender() {
  const container = document.getElementById('diagnosis-new-content');
  if (!container) return;
  container.innerHTML = renderContent();
  bindEvents();
  if (window.lucide) window.lucide.createIcons();
  revealElements(container);
}

// 根据状态渲染内容
function renderContent() {
  switch (state.status) {
    case 'loading':
      return renderLoading();
    case 'success':
      return renderSuccess();
    case 'error':
      return renderError();
    case 'idle':
    default:
      return renderIdle();
  }
}

// 空闲态：上传区
function renderIdle() {
  const recent = getRecentDiagnoses();
  return `
  <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
    <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:var(--secondary);">
      <i data-lucide="image-plus" class="w-7 h-7" style="color:var(--foreground);"></i>
    </span>
    <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:32px;color:var(--foreground);letter-spacing:-0.02em;">开始 AI 设计诊断</h1>
    <p class="mt-3 text-sm" style="color:var(--muted-foreground);">上传你的设计图，AI 将从版式、配色、字体、留白四个维度给出专业诊断与可执行修改建议。</p>

    <div id="drop-zone" role="button" tabindex="0" aria-label="点击或拖拽上传图片，支持 JPG PNG WebP，最大 10MB" class="mt-8 rounded-[20px] border-2 border-dashed p-10 cursor-pointer transition-colors hover:bg-[var(--secondary)]" style="border-color:var(--border);">
      <i data-lucide="upload-cloud" class="w-8 h-8 mx-auto" style="color:var(--muted-foreground);"></i>
      <p class="mt-4 text-sm" style="color:var(--foreground);font-weight:600;">点击选择 / 拖拽到此 / Ctrl+V 粘贴</p>
      <p class="mt-1 text-xs" style="color:var(--muted-foreground);">支持 JPG / PNG / WebP，单张 ≤ 10MB</p>
    </div>
    <input id="file-input" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" class="hidden" />

    <p class="mt-6 text-xs" style="color:var(--muted-foreground);opacity:0.7;">图片仅保存在当前页面内存中，不会上传到服务器，刷新后清除。</p>
  </div>
  ${recent.length ? `
  <section class="mt-8" data-reveal>
    <div class="mb-4 flex items-center justify-between">
      <h2 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:600;font-size:22px;color:var(--foreground);">最近诊断</h2>
      <a href="/history" data-link="/history" class="text-xs" style="color:var(--foreground);font-weight:600;">查看全部</a>
    </div>
    <div class="flex flex-col gap-3">
      ${recent.slice(0, 3).map((item) => `
      <a href="/diagnosis/${encodeURIComponent(item.taskId)}/report" data-link="/diagnosis/${encodeURIComponent(item.taskId)}/report" class="flex items-center gap-4 rounded-[20px] border p-4" style="border-color:var(--border);background:var(--card);">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]" style="background:var(--secondary);"><i data-lucide="image" class="w-5 h-5" style="color:var(--foreground);"></i></span>
        <span class="min-w-0 flex-1"><span class="block truncate text-sm" style="color:var(--foreground);font-weight:600;">${escapeHtml(item.name)}</span><span class="mt-1 block text-xs" style="color:var(--muted-foreground);">${item.designType === 'graphic' ? '平面设计' : '界面设计'} · ${formatRecentTime(item.generatedAt)}</span></span>
        <span style="color:${item.score >= 80 ? '#34c759' : item.score >= 60 ? '#ff9500' : '#ff3b30'};font-weight:700;">${item.score}分</span>
      </a>`).join('')}
    </div>
  </section>` : ''}`;
}

// 加载态
function renderLoading() {
  return `
  <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
    <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:var(--secondary);">
      <div class="app-loading-dot"></div><div class="app-loading-dot"></div><div class="app-loading-dot"></div>
    </span>
    <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:600;font-size:24px;color:var(--foreground);">正在读取图片...</h1>
    <p class="mt-2 text-sm" style="color:var(--muted-foreground);">请稍候</p>
  </div>`;
}

// 成功态：预览 + 信息 + 配置表单 + 操作
function renderSuccess() {
  const img = state.image;
  return `
  <div data-reveal class="rounded-[28px] border p-8 md:p-12" style="border-color:var(--border);background:var(--card);">
    <div class="flex items-center gap-3">
      <span class="flex h-10 w-10 items-center justify-center rounded-full" style="background:var(--secondary);">
        <i data-lucide="check" class="w-5 h-5" style="color:var(--foreground);"></i>
      </span>
      <div>
        <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);letter-spacing:-0.02em;">图片已就绪</h1>
        <p class="text-xs" style="color:var(--muted-foreground);">填写诊断配置后开始诊断</p>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      <!-- 预览 -->
      <div class="rounded-[20px] border overflow-hidden flex items-center justify-center" style="border-color:var(--border);background:var(--secondary);min-height:240px;">
        <img src="${img.url}" alt="设计图预览" class="max-w-full max-h-[320px] object-contain" />
      </div>
      <!-- 信息 -->
      <div class="flex flex-col gap-4">
        <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
          <p class="text-xs" style="color:var(--muted-foreground);">文件名</p>
          <p class="mt-1 text-sm break-all" style="color:var(--foreground);font-weight:600;">${escapeHtml(img.name)}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
            <p class="text-xs" style="color:var(--muted-foreground);">大小</p>
            <p class="mt-1 text-sm" style="color:var(--foreground);font-weight:600;">${formatSize(img.size)}</p>
          </div>
          <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
            <p class="text-xs" style="color:var(--muted-foreground);">格式</p>
            <p class="mt-1 text-sm" style="color:var(--foreground);font-weight:600;">${img.type.replace('image/', '').toUpperCase()}</p>
          </div>
        </div>
        <div class="rounded-[16px] border p-4" style="border-color:var(--border);">
          <p class="text-xs" style="color:var(--muted-foreground);">尺寸</p>
          <p class="mt-1 text-sm" style="color:var(--foreground);font-weight:600;">${img.width} × ${img.height} px</p>
        </div>
      </div>
    </div>

    <!-- 图片操作 -->
    <div class="mt-6 flex flex-wrap gap-3 justify-center">
      <button type="button" id="btn-replace" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:15px;font-weight:500;">
        <i data-lucide="refresh-cw" class="w-4 h-4 mr-2" style="color:var(--foreground);"></i>替换图片
      </button>
      <button type="button" id="btn-delete" class="inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        <i data-lucide="trash-2" class="w-4 h-4 mr-2" style="color:var(--background);"></i>删除图片
      </button>
    </div>
    <input id="file-input" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" class="hidden" />

    <!-- 分隔线 -->
    <div class="my-8 border-t" style="border-color:var(--border);"></div>

    <!-- 诊断配置表单 -->
    <form id="diagnosis-config-form" autocomplete="off" novalidate>
      <h2 class="mb-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:600;font-size:20px;color:var(--foreground);">诊断配置</h2>

      <!-- 设计类型（必选） -->
      <fieldset class="mb-6" style="border:none;padding:0;">
        <legend class="mb-3 text-sm" style="color:var(--foreground);font-weight:600;">设计类型 <span style="color:#ff3b30;">*</span></legend>
        <div class="grid grid-cols-2 gap-3" role="radiogroup" aria-label="设计类型">
          ${DESIGN_TYPES.map((t) => `
          <label data-design-type="${t.value}" tabindex="0" role="radio" aria-checked="${state.designType === t.value}" class="cursor-pointer rounded-[16px] border p-4 transition-colors ${state.designType === t.value ? '' : 'hover:bg-[var(--secondary)]'}" style="border-color:${state.designType === t.value ? 'var(--foreground)' : 'var(--border)'};background:${state.designType === t.value ? 'var(--secondary)' : 'var(--card)'};border-width:${state.designType === t.value ? '2px' : '1px'};">
            <input type="radio" name="designType" value="${t.value}" class="hidden" ${state.designType === t.value ? 'checked' : ''} />
            <span class="flex items-center gap-2">
              <span data-choice-indicator data-choice-type="radio" data-selected="${state.designType === t.value}" class="flex h-5 w-5 items-center justify-center rounded-full border" style="border-color:${state.designType === t.value ? 'var(--foreground)' : 'var(--border)'};">
                ${state.designType === t.value ? '<span class="h-2.5 w-2.5 rounded-full" style="background:var(--foreground);"></span>' : ''}
              </span>
              <span class="text-sm" style="color:var(--foreground);font-weight:500;">${t.label}</span>
            </span>
          </label>
          `).join('')}
        </div>
      </fieldset>

      <!-- 设计目标（可选） -->
      <div class="mb-6">
        <label for="goal-input" class="mb-3 block text-sm" style="color:var(--foreground);font-weight:600;">设计目标 <span class="text-xs" style="color:var(--muted-foreground);font-weight:400;">（可选）</span></label>
        <textarea id="goal-input" rows="3" placeholder="例：专业、清晰、有科技感的 SaaS 首页" class="w-full rounded-[16px] border p-4 text-sm resize-none focus:outline-none focus:border-[var(--foreground)]" style="border-color:var(--border);background:var(--card);color:var(--foreground);font-family:var(--font-sans);">${escapeHtml(state.goal)}</textarea>
      </div>

      <!-- 诊断重点（默认全选，至少保留一个） -->
      <fieldset class="mb-6" style="border:none;padding:0;">
        <legend class="mb-3 text-sm" style="color:var(--foreground);font-weight:600;">诊断重点 <span class="text-xs" style="color:var(--muted-foreground);font-weight:400;">（至少保留一个）</span></legend>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2" role="group" aria-label="诊断重点">
          ${FOCUS_DIMENSIONS.map((d) => {
            const checked = state.focusDimensions.includes(d.value);
            return `
          <label data-focus-dimension="${d.value}" tabindex="0" role="checkbox" aria-checked="${checked}" class="cursor-pointer rounded-[16px] border p-4 transition-colors ${checked ? '' : 'hover:bg-[var(--secondary)]'}" style="border-color:${checked ? 'var(--foreground)' : 'var(--border)'};background:${checked ? 'var(--secondary)' : 'var(--card)'};border-width:${checked ? '2px' : '1px'};">
            <input type="checkbox" name="focusDimensions" value="${d.value}" class="hidden" ${checked ? 'checked' : ''} />
            <span class="flex items-center gap-2">
              <span data-choice-indicator data-choice-type="checkbox" data-selected="${checked}" class="flex h-5 w-5 items-center justify-center rounded-md border" style="border-color:${checked ? 'var(--foreground)' : 'var(--border)'};background:${checked ? 'var(--foreground)' : 'transparent'};">
                ${checked ? '<span aria-hidden="true" style="color:var(--background);font-size:12px;line-height:1;">✓</span>' : ''}
              </span>
              <span class="text-sm" style="color:var(--foreground);font-weight:500;">${d.label}</span>
            </span>
          </label>`;
          }).join('')}
        </div>
      </fieldset>

      <!-- 表单错误 -->
      ${state.formError ? `
      <div class="mb-6 rounded-[16px] border p-4" style="border-color:rgba(255,59,48,0.3);background:rgba(255,59,48,0.06);">
        <p class="text-sm" style="color:#ff3b30;">${escapeHtml(state.formError)}</p>
      </div>` : ''}

      <!-- 提交按钮 -->
      <div class="flex justify-center">
        <button type="button" id="btn-start-diagnosis" class="inline-flex h-12 items-center justify-center rounded-full px-8 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:16px;font-weight:600;">
          <i data-lucide="sparkles" class="w-4 h-4 mr-2" style="color:var(--background);"></i>开始诊断
        </button>
      </div>
    </form>
  </div>`;
}

// 错误态
function renderError() {
  return `
  <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
    <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:rgba(255,59,48,0.12);">
      <i data-lucide="alert-circle" class="w-7 h-7" style="color:#ff3b30;"></i>
    </span>
    <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);">上传失败</h1>
    <p class="mt-3 text-sm" style="color:#ff3b30;">${escapeHtml(state.error)}</p>

    <div id="drop-zone" role="button" tabindex="0" aria-label="重新选择图片，支持 JPG PNG WebP，最大 10MB" class="mt-6 rounded-[20px] border-2 border-dashed p-8 cursor-pointer transition-colors hover:bg-[var(--secondary)]" style="border-color:var(--border);">
      <i data-lucide="upload-cloud" class="w-7 h-7 mx-auto" style="color:var(--muted-foreground);"></i>
      <p class="mt-3 text-sm" style="color:var(--foreground);font-weight:600;">重新选择 / 拖拽 / Ctrl+V 粘贴</p>
    </div>
    <input id="file-input" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" class="hidden" />

    <a href="/" data-link="/" class="mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:15px;font-weight:500;">
      返回首页
    </a>
  </div>`;
}

// HTML 转义
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatRecentTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '刚刚' : date.toLocaleDateString('zh-CN');
}

// 绑定交互事件
function bindEvents() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const btnReplace = document.getElementById('btn-replace');
  const btnDelete = document.getElementById('btn-delete');
  const btnStart = document.getElementById('btn-start-diagnosis');
  const goalInput = document.getElementById('goal-input');

  // 文件选择
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleFile(file);
      e.target.value = '';
    });
  }

  // 点击上传区 → 触发文件选择
  const triggerPicker = (e) => {
    e.preventDefault();
    if (fileInput) fileInput.click();
  };
  if (dropZone) {
    dropZone.addEventListener('click', triggerPicker);
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });

    // 拖拽状态
    let dragCounter = 0;
    dropZone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      dropZone.style.borderColor = 'var(--foreground)';
      dropZone.style.background = 'var(--secondary)';
    });
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
      }
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      dropZone.style.borderColor = '';
      dropZone.style.background = '';
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }

  // 替换按钮
  if (btnReplace) {
    btnReplace.addEventListener('click', (e) => {
      e.preventDefault();
      if (fileInput) fileInput.click();
    });
  }

  // 删除按钮
  if (btnDelete) {
    btnDelete.addEventListener('click', (e) => {
      e.preventDefault();
      handleDelete();
    });
  }

  // 设计类型 radio
  document.querySelectorAll('[data-design-type]').forEach((label) => {
    const input = label.querySelector('input[name="designType"]');
    const activate = (e) => {
      e.preventDefault();
      if (input) selectDesignType(input.value);
    };
    label.addEventListener('click', activate);
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') activate(e);
    });
  });

  // 设计目标 textarea（不触发 rerender，避免输入时光标跳）
  if (goalInput) {
    goalInput.addEventListener('input', (e) => {
      inputGoal(e.target.value);
    });
  }

  // 诊断重点 checkbox
  document.querySelectorAll('[data-focus-dimension]').forEach((label) => {
    const input = label.querySelector('input[name="focusDimensions"]');
    const activate = (e) => {
      e.preventDefault();
      if (!input) return;
      input.checked = !input.checked;
      toggleFocusDimension(input.value);
    };
    label.addEventListener('click', activate);
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') activate(e);
    });
  });

  // 开始诊断
  if (btnStart) {
    btnStart.addEventListener('click', (e) => {
      e.preventDefault();
      handleCreateTask();
    });
  }
}

// 挂载：注册粘贴监听，渲染初始内容
export function mountDiagnosisNew() {
  pasteHandler = (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFile(file);
          return;
        }
      }
    }
  };
  document.addEventListener('paste', pasteHandler);
  rerender();
}

// 卸载：移除粘贴监听、释放未提交图片的 URL、重置表单 UI 状态
// 注意：
// - 已创建任务的场景：handleCreateTask 已把 currentObjectUrl 置空，URL 责任转交 taskStore
// - 未创建任务的场景：currentObjectUrl 仍有值，这里释放未提交的图片 URL
// - taskStore 的 URL 由 main.js 跨流程判断时统一释放，这里不碰
export function unmountDiagnosisNew() {
  if (pasteHandler) {
    document.removeEventListener('paste', pasteHandler);
    pasteHandler = null;
  }
  // 释放未提交图片的 URL（如果有）
  releaseObjectUrl();
  // 重置表单 UI 状态
  state.status = 'idle';
  state.error = '';
  state.image = null;
  state.designType = '';
  state.goal = '';
  state.focusDimensions = ['layout', 'color', 'typography', 'whitespace'];
  state.formError = '';
}

// 导出渲染函数
export function renderDiagnosisNew() {
  return `<section class="mx-auto max-w-[800px] px-6" style="padding-top:96px;padding-bottom:96px;"><div id="diagnosis-new-content"></div></section>`;
}
