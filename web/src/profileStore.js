// 个人中心统一历史数据层
// 兼容现有训练 store，同时保存可删除的个人中心记录。

import { getRecentSessions, getRecentSpotSessions, getRecentScoringSessions } from './training/trainingStore.js';
import { getRecentDiagnoses } from './taskStore.js';

const TRAINING_KEY = 'meishang.profile.training.v1';
const DIAGNOSIS_KEY = 'meishang.profile.diagnosis.v1';
const HISTORY_CONTROL_KEY = 'meishang.profile.history-control.v1';
const MAX_DELETED_IDS = 300;

const safeArray = (value) => (Array.isArray(value) ? value : []);

function read(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return safeArray(parsed).filter((item) => item && typeof item === 'object');
  } catch (_) {
    return [];
  }
}

function write(key, records) {
  try {
    localStorage.setItem(key, JSON.stringify(records.slice(0, 100)));
    return true;
  } catch (_) {
    return false;
  }
}

function readHistoryControl() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_CONTROL_KEY) || '{}');
    return {
      clearedAt: {
        training: Number(stored?.clearedAt?.training) || 0,
        diagnosis: Number(stored?.clearedAt?.diagnosis) || 0,
      },
      deletedIds: safeArray(stored?.deletedIds).map(String).slice(-MAX_DELETED_IDS),
    };
  } catch (_) {
    return { clearedAt: { training: 0, diagnosis: 0 }, deletedIds: [] };
  }
}

function writeHistoryControl(control) {
  try {
    localStorage.setItem(HISTORY_CONTROL_KEY, JSON.stringify({
      clearedAt: {
        training: Number(control?.clearedAt?.training) || 0,
        diagnosis: Number(control?.clearedAt?.diagnosis) || 0,
      },
      deletedIds: safeArray(control?.deletedIds).map(String).slice(-MAX_DELETED_IDS),
    }));
    return true;
  } catch (_) {
    return false;
  }
}

function recordTimestamp(record) {
  const timestamp = new Date(record?.createdAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isVisibleRecord(record, type, control) {
  if (control.deletedIds.includes(String(record.id))) return false;
  return recordTimestamp(record) > control.clearedAt[type];
}

function makeId(prefix = 'record') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(record, fallbackType = 'training') {
  const score = Number(record?.score ?? record?.averageScore ?? record?.totalScore);
  return {
    id: String(record?.id || makeId(fallbackType)),
    type: record?.type || fallbackType,
    title: String(record?.title || (fallbackType === 'diagnosis' ? 'AI 设计诊断' : '审美训练')),
    score: Number.isFinite(score) ? Math.round(score) : 0,
    summary: String(record?.summary || ''),
    createdAt: record?.createdAt || record?.completedAt || record?.generatedAt || new Date().toISOString(),
    meta: record?.meta || {},
    route: record?.route || '',
  };
}

function legacyTrainingRecords() {
  const records = [];
  getRecentSessions(20).forEach((item) => records.push(normalize({
    id: `compare-${item.completedAt || item.startedAt || 'legacy'}`,
    type: 'training', title: '好坏对比训练', score: item.accuracy, createdAt: item.completedAt,
    summary: `${item.correct || 0}/${item.total || 0} 题正确`, meta: { dimensionScores: item.dimensionStats },
  })));
  getRecentSpotSessions(20).forEach((item) => records.push(normalize({
    id: `spot-${item.completedAt || item.startedAt || 'legacy'}`,
    type: 'training', title: '找茬训练', score: item.total ? Math.round(item.totalScore / item.total) : 0, createdAt: item.completedAt,
    summary: `${item.totalFound || 0} 个问题已发现`, meta: { dimensionScores: item.dimensionStats },
  })));
  getRecentScoringSessions(20).forEach((item) => records.push(normalize({
    id: `scoring-${item.completedAt || item.startedAt || 'legacy'}`,
    type: 'training', title: '维度打分训练', score: 0, createdAt: item.completedAt,
    summary: item.biasedDimension ? `重点校准：${item.biasedDimension}` : '已完成一轮维度打分', meta: { dimensionScores: item.dimensionStats },
  })));
  return records;
}

function legacyDiagnosisRecords() {
  return getRecentDiagnoses().map((item) => normalize({
    id: `diagnosis-${item.taskId || item.generatedAt}`,
    type: 'diagnosis', title: item.name || 'AI 设计诊断', score: item.score,
    createdAt: item.generatedAt, summary: item.provider === 'mock' ? 'Mock 诊断结果' : '通义千问 VL 诊断结果',
    meta: { scores: item.report?.scores || {}, provider: item.provider, reportId: item.report?.reportId, designType: item.designType },
    route: item.taskId ? `/diagnosis/${item.taskId}/report` : '',
  }, 'diagnosis'));
}

export function addTrainingRecord(record) {
  const normalized = normalize(record, 'training');
  const records = read(TRAINING_KEY).filter((item) => item.id !== normalized.id);
  return write(TRAINING_KEY, [normalized, ...records]) ? normalized : null;
}

export function addDiagnosisRecord(record) {
  const normalized = normalize(record, 'diagnosis');
  const records = read(DIAGNOSIS_KEY).filter((item) => item.id !== normalized.id);
  return write(DIAGNOSIS_KEY, [normalized, ...records]) ? normalized : null;
}

export function getHistoryByType(type) {
  const key = type === 'diagnosis' ? DIAGNOSIS_KEY : TRAINING_KEY;
  const control = readHistoryControl();
  const own = read(key).map((item) => normalize(item, type));
  const legacy = type === 'diagnosis' ? legacyDiagnosisRecords() : legacyTrainingRecords();
  const source = [...own, ...legacy].filter((item) => isVisibleRecord(item, type, control));
  const unique = [...new Map(source.map((item) => [item.id, normalize(item, type)] )).values()];
  if (unique.length !== own.length || unique.some((item, index) => item.id !== own[index]?.id)) write(key, unique);
  return unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getAllHistory() {
  return [...getHistoryByType('training'), ...getHistoryByType('diagnosis')]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function deleteHistoryRecord(id) {
  if (!id) return false;
  const recordId = String(id);
  const training = read(TRAINING_KEY);
  const diagnosis = read(DIAGNOSIS_KEY);
  const nextTraining = training.filter((item) => item.id !== recordId);
  const nextDiagnosis = diagnosis.filter((item) => item.id !== recordId);
  const control = readHistoryControl();
  const nextDeletedIds = [...new Set([...control.deletedIds, recordId])].slice(-MAX_DELETED_IDS);
  const recordsWritten = write(TRAINING_KEY, nextTraining) && write(DIAGNOSIS_KEY, nextDiagnosis);
  return writeHistoryControl({ ...control, deletedIds: nextDeletedIds }) && recordsWritten;
}

export function clearHistory(type) {
  const now = Date.now();
  const control = readHistoryControl();
  const clearedAt = { ...control.clearedAt };
  if (type === 'diagnosis') {
    clearedAt.diagnosis = now;
    return write(DIAGNOSIS_KEY, []) && writeHistoryControl({ ...control, clearedAt });
  }
  if (type === 'training') {
    clearedAt.training = now;
    return write(TRAINING_KEY, []) && writeHistoryControl({ ...control, clearedAt });
  }
  clearedAt.training = now;
  clearedAt.diagnosis = now;
  return write(TRAINING_KEY, []) && write(DIAGNOSIS_KEY, []) && writeHistoryControl({ ...control, clearedAt });
}

export function getProfileStats() {
  const training = getHistoryByType('training');
  const diagnosis = getHistoryByType('diagnosis');
  const scored = [...training, ...diagnosis].filter((item) => Number.isFinite(Number(item.score)));
  const averageScore = scored.length
    ? Math.round(scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length)
    : 0;
  const dimensions = { layout: 0, color: 0, typography: 0, whitespace: 0 };
  const counts = { layout: 0, color: 0, typography: 0, whitespace: 0 };
  [...training, ...diagnosis].forEach((item) => {
    const scores = item.meta?.scores || item.meta?.dimensionScores || {};
    Object.entries(scores).forEach(([key, value]) => {
      if (key in dimensions && Number.isFinite(Number(value))) {
        dimensions[key] += Number(value);
        counts[key] += 1;
      }
    });
  });
  Object.keys(dimensions).forEach((key) => {
    dimensions[key] = counts[key] ? Math.round(dimensions[key] / counts[key]) : 0;
  });
  return {
    trainingCount: training.length,
    diagnosisCount: diagnosis.length,
    averageScore,
    dimensions,
    recent: getAllHistory().slice(0, 6),
  };
}

export function clearProfileHistoryForTests() {
  clearHistory();
  try {
    localStorage.removeItem(HISTORY_CONTROL_KEY);
  } catch (_) {}
}
