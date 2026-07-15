// 审美训练 - 状态持久化
// 管理：训练历史记录、错题记录、累计统计
// 所有数据持久化到 localStorage，不存储题目本身、图片二进制、base64、File、Blob
// 只保存轻量字段：题目 id、答案、正确率、时间戳

const STORAGE_KEY = 'training-state-v1';
const MAX_HISTORY = 20; // 最多保存最近 20 次训练记录

/**
 * 持久化状态结构：
 * {
 *   history: [
 *     {
 *       completedAt: ISO 时间字符串,
 *       total: number,
 *       correct: number,
 *       accuracy: number, // 0-100，保留一位小数
 *       dimensionStats: {
 *         contrast: { total, correct },
 *         alignment: { total, correct },
 *         repetition: { total, correct },
 *         proximity: { total, correct }
 *       },
 *       wrongQuestionIds: string[]
 *     }
 *   ],
 *   wrongQuestions: { [questionId]: { userAnswer, correctAnswer, wrongAt } },
 *   stats: { totalAnswered, totalCorrect, totalSessions }
 * }
 */

const DEFAULT_STATE = {
  history: [],
  wrongQuestions: {},
  stats: {
    totalAnswered: 0,
    totalCorrect: 0,
    totalSessions: 0,
  },
};

/**
 * 读取完整状态
 * @returns {Object} 状态对象，读取失败返回默认状态
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneState(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      wrongQuestions: parsed.wrongQuestions && typeof parsed.wrongQuestions === 'object' ? parsed.wrongQuestions : {},
      stats: {
        totalAnswered: Number(parsed.stats?.totalAnswered) || 0,
        totalCorrect: Number(parsed.stats?.totalCorrect) || 0,
        totalSessions: Number(parsed.stats?.totalSessions) || 0,
      },
    };
  } catch (e) {
    console.warn('[trainingStore] 读取训练状态失败，使用默认状态', e);
    return cloneState(DEFAULT_STATE);
  }
}

function cloneState(state) {
  return {
    history: [...state.history],
    wrongQuestions: { ...state.wrongQuestions },
    stats: { ...state.stats },
  };
}

/**
 * 写入完整状态
 * @param {Object} state
 */
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[trainingStore] 保存训练状态失败', e);
  }
}

/**
 * 记录一次答题（实时维护错题与累计统计）
 * @param {string} questionId - 题目 id
 * @param {string} userAnswer - 用户选择的选项 id
 * @param {string} correctAnswer - 正确答案
 * @returns {boolean} 是否答对
 */
export function recordAnswer(questionId, userAnswer, correctAnswer) {
  if (!questionId) return false;
  const state = loadState();
  const isCorrect = userAnswer === correctAnswer;

  // 错题管理：答错则记入错题，答对则从错题中移除
  if (!isCorrect) {
    state.wrongQuestions[questionId] = {
      userAnswer,
      correctAnswer,
      wrongAt: Date.now(),
    };
  } else {
    delete state.wrongQuestions[questionId];
  }

  // 累计统计
  state.stats.totalAnswered += 1;
  if (isCorrect) state.stats.totalCorrect += 1;

  saveState(state);
  return isCorrect;
}

/**
 * 记录一次完整训练会话（保存到 history，最多保留 MAX_HISTORY 条）
 * @param {Object} session - 训练会话数据
 * @param {Array} session.answers - 答题明细 [{ questionId, dimension, userAnswer, isCorrect }]
 * @param {number} session.startedAt - 开始时间戳
 * @param {number} session.finishedAt - 结束时间戳
 * @returns {Object} 保存的记录
 */
export function recordSession(session) {
  const state = loadState();
  const answers = Array.isArray(session.answers) ? session.answers : [];

  const total = answers.length;
  const correct = answers.filter((a) => a.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0; // 保留一位小数

  // 按维度统计
  const dimensionStats = {
    contrast: { total: 0, correct: 0 },
    alignment: { total: 0, correct: 0 },
    repetition: { total: 0, correct: 0 },
    proximity: { total: 0, correct: 0 },
  };
  for (const a of answers) {
    if (!dimensionStats[a.dimension]) continue;
    dimensionStats[a.dimension].total += 1;
    if (a.isCorrect) dimensionStats[a.dimension].correct += 1;
  }

  const wrongQuestionIds = answers.filter((a) => !a.isCorrect).map((a) => a.questionId);

  const record = {
    completedAt: new Date(session.finishedAt || Date.now()).toISOString(),
    total,
    correct,
    accuracy,
    dimensionStats,
    wrongQuestionIds,
    questionIds: answers.map((answer) => answer.questionId),
  };

  state.history.push(record);
  state.stats.totalSessions += 1;

  // 超过上限时删除最旧记录
  if (state.history.length > MAX_HISTORY) {
    state.history = state.history.slice(-MAX_HISTORY);
  }

  saveState(state);
  return record;
}

export function getRecentQuestionIds(limit = 20) {
  const state = loadState();
  const ids = [];
  for (const session of state.history.slice().reverse()) {
    const sessionIds = Array.isArray(session.questionIds) ? session.questionIds : session.wrongQuestionIds || [];
    for (const id of sessionIds) {
      if (id && !ids.includes(id)) ids.push(id);
      if (ids.length >= limit) return ids;
    }
  }
  return ids;
}

/**
 * 获取最近 N 次训练记录
 * @param {number} limit - 返回条数，默认 20
 * @returns {Array} 按时间倒序排列
 */
export function getRecentSessions(limit = MAX_HISTORY) {
  const state = loadState();
  const n = Math.max(0, Number(limit) || 0);
  return state.history.slice(-n).reverse();
}

/**
 * 获取所有错题 id 列表
 * @returns {Array<string>}
 */
export function getWrongQuestionIds() {
  const state = loadState();
  return Object.keys(state.wrongQuestions);
}

/**
 * 获取错题详情（含用户答案与正确答案）
 * @returns {Array} [{ questionId, userAnswer, correctAnswer, wrongAt }]
 */
export function getWrongQuestions() {
  const state = loadState();
  return Object.entries(state.wrongQuestions).map(([questionId, info]) => ({
    questionId,
    userAnswer: info.userAnswer,
    correctAnswer: info.correctAnswer,
    wrongAt: info.wrongAt,
  }));
}

/**
 * 判断某题是否在错题列表中
 * @param {string} questionId
 * @returns {boolean}
 */
export function isWrongQuestion(questionId) {
  const state = loadState();
  return Boolean(state.wrongQuestions[questionId]);
}

/**
 * 从错题中移除指定题目（用于错题重练答对后清理）
 * @param {string} questionId
 */
export function removeWrongQuestion(questionId) {
  const state = loadState();
  if (state.wrongQuestions[questionId]) {
    delete state.wrongQuestions[questionId];
    saveState(state);
  }
}

/**
 * 获取累计统计
 * @returns {Object} { totalAnswered, totalCorrect, totalSessions, accuracy }
 */
export function getStats() {
  const state = loadState();
  const { totalAnswered, totalCorrect, totalSessions } = state.stats;
  const accuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;
  return { totalAnswered, totalCorrect, totalSessions, accuracy };
}

/**
 * 获取错题数量
 * @returns {number}
 */
export function getWrongCount() {
  const state = loadState();
  return Object.keys(state.wrongQuestions).length;
}

/**
 * 清空所有训练数据（重置）
 */
export function clearAllTrainingData() {
  saveState(cloneState(DEFAULT_STATE));
}

/* ============ 找茬训练（spot training）独立存储 ============ */
// 与好坏对比训练隔离，避免影响现有 recordSession 逻辑。

const SPOT_STORAGE_KEY = 'training-spot-state-v1';
const SPOT_MAX_HISTORY = 20;

const DEFAULT_SPOT_STATE = {
  history: [],
  stats: { totalAnswered: 0, totalFound: 0, totalMissed: 0, totalWrongClicks: 0, totalScore: 0, totalSessions: 0 },
};

function loadSpotState() {
  try {
    const raw = localStorage.getItem(SPOT_STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SPOT_STATE));
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      stats: {
        totalAnswered: Number(parsed.stats?.totalAnswered) || 0,
        totalFound: Number(parsed.stats?.totalFound) || 0,
        totalMissed: Number(parsed.stats?.totalMissed) || 0,
        totalWrongClicks: Number(parsed.stats?.totalWrongClicks) || 0,
        totalScore: Number(parsed.stats?.totalScore) || 0,
        totalSessions: Number(parsed.stats?.totalSessions) || 0,
      },
    };
  } catch (e) {
    console.warn('[trainingStore] 读取找茬训练状态失败，使用默认状态', e);
    return JSON.parse(JSON.stringify(DEFAULT_SPOT_STATE));
  }
}

function saveSpotState(spotState) {
  try {
    localStorage.setItem(SPOT_STORAGE_KEY, JSON.stringify(spotState));
  } catch (e) {
    console.warn('[trainingStore] 保存找茬训练状态失败', e);
  }
}

/**
 * 记录一次找茬训练会话
 * @param {Object} session
 * @param {Array} session.answers - [{ questionId, dimension, foundHotspotIds, missedHotspotIds, wrongClickCount, score, completedAt }]
 * @param {number} session.startedAt
 * @param {number} session.finishedAt
 * @returns {Object} 保存的记录
 */
export function recordSpotSession(session) {
  const spotState = loadSpotState();
  const answers = Array.isArray(session.answers) ? session.answers : [];

  const total = answers.length;
  const totalScore = answers.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
  const totalFound = answers.reduce((sum, a) => sum + (Array.isArray(a.foundHotspotIds) ? a.foundHotspotIds.length : 0), 0);
  const totalMissed = answers.reduce((sum, a) => sum + (Array.isArray(a.missedHotspotIds) ? a.missedHotspotIds.length : 0), 0);
  const totalWrongClicks = answers.reduce((sum, a) => sum + (Number(a.wrongClickCount) || 0), 0);

  // 各维度得分
  const dimensionStats = {
    contrast: { total: 0, score: 0 },
    alignment: { total: 0, score: 0 },
    repetition: { total: 0, score: 0 },
    proximity: { total: 0, score: 0 },
  };
  for (const a of answers) {
    if (!dimensionStats[a.dimension]) continue;
    dimensionStats[a.dimension].total += 1;
    dimensionStats[a.dimension].score += Number(a.score) || 0;
  }

  // 最薄弱维度：平均得分最低
  let weakestDimension = null;
  let weakestAvg = Infinity;
  for (const [dim, s] of Object.entries(dimensionStats)) {
    if (s.total === 0) continue;
    const avg = s.score / s.total;
    if (avg < weakestAvg) {
      weakestAvg = avg;
      weakestDimension = dim;
    }
  }

  const record = {
    completedAt: new Date(session.finishedAt || Date.now()).toISOString(),
    total,
    totalScore,
    totalFound,
    totalMissed,
    totalWrongClicks,
    dimensionStats,
    weakestDimension,
    questionIds: answers.map((a) => a.questionId),
    answers,
  };

  spotState.history.push(record);
  if (spotState.history.length > SPOT_MAX_HISTORY) {
    spotState.history = spotState.history.slice(-SPOT_MAX_HISTORY);
  }

  spotState.stats.totalAnswered += total;
  spotState.stats.totalFound += totalFound;
  spotState.stats.totalMissed += totalMissed;
  spotState.stats.totalWrongClicks += totalWrongClicks;
  spotState.stats.totalScore += totalScore;
  spotState.stats.totalSessions += 1;

  saveSpotState(spotState);
  return record;
}

/**
 * 获取最近做过的找茬题目 id（用于抽题冷却）
 * @param {number} limit - 默认 20
 * @returns {Array<string>}
 */
export function getRecentSpotQuestionIds(limit = 20) {
  const spotState = loadSpotState();
  const ids = [];
  for (const session of spotState.history.slice().reverse()) {
    const sessionIds = Array.isArray(session.questionIds) ? session.questionIds : [];
    for (const id of sessionIds) {
      if (id && !ids.includes(id)) ids.push(id);
      if (ids.length >= limit) return ids;
    }
  }
  return ids;
}

/**
 * 获取找茬训练最近会话记录
 * @param {number} limit - 默认 20
 * @returns {Array}
 */
export function getRecentSpotSessions(limit = SPOT_MAX_HISTORY) {
  const spotState = loadSpotState();
  const n = Math.max(0, Number(limit) || 0);
  return spotState.history.slice(-n).reverse();
}

/* ============ 维度打分训练（scoring training）独立存储 ============ */
// 与好坏对比训练、找茬训练隔离，避免影响现有逻辑。
// 记录用户评分与 AI 参考评分的差异，用于校准审美标尺。

const SCORING_STORAGE_KEY = 'training-scoring-state-v1';
const SCORING_MAX_HISTORY = 20;
const SCORING_DIMENSIONS = ['layout', 'color', 'typography', 'whitespace'];

const DEFAULT_SCORING_STATE = {
  history: [],
  stats: { totalAnswered: 0, totalSessions: 0 },
};

function loadScoringState() {
  try {
    const raw = localStorage.getItem(SCORING_STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SCORING_STATE));
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      stats: {
        totalAnswered: Number(parsed.stats?.totalAnswered) || 0,
        totalSessions: Number(parsed.stats?.totalSessions) || 0,
      },
    };
  } catch (e) {
    console.warn('[trainingStore] 读取维度打分训练状态失败，使用默认状态', e);
    return JSON.parse(JSON.stringify(DEFAULT_SCORING_STATE));
  }
}

function saveScoringState(s) {
  try {
    localStorage.setItem(SCORING_STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('[trainingStore] 保存维度打分训练状态失败', e);
  }
}

/**
 * 计算单个维度上用户与 AI 的平均差异（正=高估，负=低估）
 * @param {Array} answers - 会话答题列表
 * @param {string} dim - 维度
 * @returns {number} 平均差异
 */
function avgDiffByDimension(answers, dim) {
  let sum = 0;
  let count = 0;
  for (const a of answers) {
    const u = Number(a.userScores?.[dim]);
    const ai = Number(a.aiScores?.[dim]);
    if (Number.isFinite(u) && Number.isFinite(ai)) {
      sum += u - ai;
      count += 1;
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * 记录一次维度打分训练会话
 * @param {Object} session
 * @param {Array} session.answers - [{ questionId, dimension, userScores, aiScores, scoreDifference, weakestDimension, completedAt }]
 * @param {number} session.startedAt
 * @param {number} session.finishedAt
 * @returns {Object} 保存的记录
 */
export function recordScoringSession(session) {
  const s = loadScoringState();
  const answers = Array.isArray(session.answers) ? session.answers : [];
  const total = answers.length;

  // 各维度平均分（用户与 AI）
  const dimensionStats = {};
  for (const dim of SCORING_DIMENSIONS) {
    let userSum = 0;
    let aiSum = 0;
    let diffSum = 0;
    let count = 0;
    for (const a of answers) {
      const u = Number(a.userScores?.[dim]);
      const ai = Number(a.aiScores?.[dim]);
      if (Number.isFinite(u)) userSum += u;
      if (Number.isFinite(ai)) aiSum += ai;
      if (Number.isFinite(u) && Number.isFinite(ai)) {
        diffSum += u - ai;
        count += 1;
      }
    }
    dimensionStats[dim] = {
      userAvg: total > 0 ? userSum / total : 0,
      aiAvg: total > 0 ? aiSum / total : 0,
      avgDiff: count > 0 ? diffSum / count : 0,
    };
  }

  // 最容易高估/低估的维度（按平均差异绝对值排序）
  let biasedDimension = null;
  let biasedAbs = -1;
  for (const dim of SCORING_DIMENSIONS) {
    const abs = Math.abs(dimensionStats[dim].avgDiff);
    if (abs > biasedAbs) {
      biasedAbs = abs;
      biasedDimension = dim;
    }
  }
  const biasDirection = biasedDimension
    ? (dimensionStats[biasedDimension].avgDiff > 0 ? 'overestimate' : 'underestimate')
    : null;

  const record = {
    completedAt: new Date(session.finishedAt || Date.now()).toISOString(),
    total,
    dimensionStats,
    biasedDimension,
    biasDirection,
    questionIds: answers.map((a) => a.questionId),
    answers,
  };

  s.history.push(record);
  if (s.history.length > SCORING_MAX_HISTORY) {
    s.history = s.history.slice(-SCORING_MAX_HISTORY);
  }
  s.stats.totalAnswered += total;
  s.stats.totalSessions += 1;

  saveScoringState(s);
  return record;
}

/**
 * 获取最近做过的维度打分题目 id（用于抽题冷却）
 * @param {number} limit - 默认 20
 * @returns {Array<string>}
 */
export function getRecentScoringQuestionIds(limit = 20) {
  const s = loadScoringState();
  const ids = [];
  for (const session of s.history.slice().reverse()) {
    const sessionIds = Array.isArray(session.questionIds) ? session.questionIds : [];
    for (const id of sessionIds) {
      if (id && !ids.includes(id)) ids.push(id);
      if (ids.length >= limit) return ids;
    }
  }
  return ids;
}

/**
 * 获取维度打分训练最近会话记录
 * @param {number} limit - 默认 20
 * @returns {Array}
 */
export function getRecentScoringSessions(limit = SCORING_MAX_HISTORY) {
  const s = loadScoringState();
  const n = Math.max(0, Number(limit) || 0);
  return s.history.slice(-n).reverse();
}
