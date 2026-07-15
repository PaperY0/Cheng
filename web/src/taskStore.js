// 任务内存存储（模块级，不持久化，刷新即丢失）
// 当前阶段只保存最近创建的任务，供诊断流程页面读取

let currentTask = null;
const RECENT_KEY = 'meishang.recentDiagnoses';

export function setTask(task) {
  currentTask = task;
}

export function getTask(taskId) {
  if (currentTask && (!taskId || currentTask.taskId === taskId)) return currentTask;
  if (!taskId) return null;
  try {
    const records = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const record = records.find((item) => item.taskId === taskId && item.report);
    if (!record) return null;
    return {
      taskId: record.taskId,
      image: { name: record.name, url: null, file: null }, // file: null，刷新后无原始 File
      designType: record.designType,
      report: record.report,
      provider: record.provider,
      status: 'success',
      previewImages: record.previewImages || {},
    };
  } catch (_) {
    return null;
  }
}

export function clearTask() {
  currentTask = null;
}

// 更新任务状态
export function updateTaskStatus(taskId, status) {
  if (!currentTask) return;
  if (taskId && currentTask.taskId !== taskId) return;
  currentTask.status = status;
}

// 更新任务报告
export function updateTaskReport(taskId, report, provider) {
  if (!currentTask) return;
  if (taskId && currentTask.taskId !== taskId) return;
  currentTask.report = report;
  if (provider) currentTask.provider = provider;
  // 初始化 previewImages 容器（实际数据由 updatePreviewImage 写入）
  if (!currentTask.previewImages) currentTask.previewImages = {};
}

// 更新单条 issue 的效果图状态（写回内存 task）
// state: { status, imageUrl, generatedAt, error }
export function updatePreviewImage(taskId, issueId, state) {
  if (!currentTask) return;
  if (taskId && currentTask.taskId !== taskId) return;
  if (!currentTask.previewImages) currentTask.previewImages = {};
  if (!issueId) return;
  currentTask.previewImages[issueId] = {
    status: state.status || 'idle',
    imageUrl: state.imageUrl || null,
    generatedAt: state.generatedAt || null,
    error: state.error || null,
  };
}

// 获取单条 issue 的效果图状态
export function getPreviewImage(taskId, issueId) {
  if (!currentTask) return null;
  if (taskId && currentTask.taskId !== taskId) return null;
  if (!currentTask.previewImages) return null;
  return currentTask.previewImages[issueId] || null;
}

// 获取当前任务所有效果图状态（用于报告页初始化按钮）
export function getPreviewImages(taskId) {
  if (!currentTask) return {};
  if (taskId && currentTask.taskId !== taskId) return {};
  return currentTask.previewImages || {};
}

export function saveRecentDiagnosis(task) {
  if (!task || !task.report) return;
  const values = Object.values(task.report.scores || {}).map(Number).filter(Number.isFinite);
  // 持久化效果图状态：只保存轻量字段，不含 File/base64/Blob
  // previewImages 格式：{ "issue-1": { status, imageUrl, generatedAt } }
  const previewImagesLite = {};
  if (task.previewImages) {
    for (const [issueId, info] of Object.entries(task.previewImages)) {
      // 只持久化 success 状态且有 url 的记录；error/idle/loading 不持久化
      if (info && info.status === 'success' && info.imageUrl) {
        previewImagesLite[issueId] = {
          status: 'success',
          imageUrl: info.imageUrl,
          generatedAt: info.generatedAt || null,
        };
      }
    }
  }
  const record = {
    taskId: task.taskId,
    name: task.image?.name || '未命名设计',
    designType: task.designType,
    score: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
    generatedAt: task.report.generatedAt || new Date().toISOString(),
    provider: task.provider || 'mock',
    report: task.report,
    previewImages: previewImagesLite,
  };
  try {
    const previous = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const next = [record, ...previous.filter((item) => item.taskId !== record.taskId)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch (_) {}
}

export function getRecentDiagnoses() {
  try {
    const records = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(records) ? records : [];
  } catch (_) {
    return [];
  }
}

// 释放任务关联的图片 object URL（幂等，多次调用安全）
export function releaseTaskImage(taskId) {
  if (!currentTask) return;
  if (taskId && currentTask.taskId !== taskId) return;
  const url = currentTask.image && currentTask.image.url;
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch (_) {
      // revoke 失败不抛错，保证幂等
    }
    // 标记已释放，防止重复释放
    currentTask.image.url = null;
  }
}

// 生成不可预测的 taskId：crypto.randomUUID + 时间戳前缀
export function generateTaskId() {
  const ts = Date.now().toString(36);
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${ts}-${crypto.randomUUID()}`;
  }
  // 回退方案
  const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `${ts}-${rand}`;
}
