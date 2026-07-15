// 当前诊断任务：内存用于即时交互，localStorage 用于刷新/恢复后的继续诊断。
// 图片只以 data URL 持久化，运行期预览仍使用 Blob URL，避免内存泄漏。

let currentTask = null;
const RECENT_KEY = 'meishang.recentDiagnoses';
const ACTIVE_TASK_KEY = 'meishang.activeDiagnosis';

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '');
    return value || fallback;
  } catch (_) {
    return fallback;
  }
}

function persistCurrentTask() {
  if (!currentTask) return;
  const image = currentTask.image || {};
  const record = {
    ...currentTask,
    image: {
      name: image.name || '未命名图片',
      size: image.size || 0,
      type: image.type || 'image/png',
      width: image.width || 0,
      height: image.height || 0,
      // 只保存可跨刷新恢复的数据，不保存临时 blob: URL / File 对象。
      dataUrl: image.dataUrl || null,
    },
  };
  try {
    localStorage.setItem(ACTIVE_TASK_KEY, JSON.stringify(record));
  } catch (_) {
    // localStorage 容量不足时不影响当前流程；内存任务仍可继续完成诊断。
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!(file instanceof File)) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function restoreImage(image = {}) {
  const restored = { ...image, url: null, file: null };
  if (!image.dataUrl || typeof File === 'undefined' || typeof URL === 'undefined') return restored;
  try {
    const [header, encoded] = image.dataUrl.split(',', 2);
    const mime = /^data:([^;]+);base64$/i.exec(header)?.[1] || image.type || 'image/png';
    const binary = atob(encoded || '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const file = new File([bytes], image.name || 'design-image', { type: mime });
    restored.file = file;
    restored.url = URL.createObjectURL(file);
  } catch (_) {
    // 损坏的本地缓存不阻断报告查看；重新上传即可再次诊断。
  }
  return restored;
}

function restoreActiveTask(taskId) {
  const record = readStorage(ACTIVE_TASK_KEY, null);
  if (!record || !record.taskId || (taskId && record.taskId !== taskId)) return null;
  currentTask = {
    ...record,
    image: restoreImage(record.image),
    previewImages: record.previewImages || {},
  };
  return currentTask;
}

export function setTask(task) {
  currentTask = task;
  persistCurrentTask();
  // FileReader 异步读取不阻塞跳转；读取完成后刷新持久化记录。
  const file = task?.image?.file;
  if (typeof File !== 'undefined' && file instanceof File) {
    fileToDataUrl(file).then((dataUrl) => {
      if (!dataUrl || !currentTask || currentTask.taskId !== task.taskId) return;
      currentTask.image.dataUrl = dataUrl;
      persistCurrentTask();
    });
  }
}

export function getTask(taskId) {
  if (currentTask && (!taskId || currentTask.taskId === taskId)) return currentTask;
  if (!taskId) return null;
  const activeTask = restoreActiveTask(taskId);
  if (activeTask) return activeTask;
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
  persistCurrentTask();
}

// 更新任务报告
export function updateTaskReport(taskId, report, provider) {
  if (!currentTask) return;
  if (taskId && currentTask.taskId !== taskId) return;
  currentTask.report = report;
  if (provider) currentTask.provider = provider;
  // 初始化 previewImages 容器（实际数据由 updatePreviewImage 写入）
  if (!currentTask.previewImages) currentTask.previewImages = {};
  persistCurrentTask();
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
  persistCurrentTask();
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
