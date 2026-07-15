// 维度打分训练题库与采样逻辑测试
// 运行：在 web/ 目录下执行 `npm test`
// 覆盖：题目数量、维度分布、ID 唯一性、场景非空、图片合法、
//       validateScoringQuestions、抽题冷却与维度多样性、store 持久化。

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scoringQuestions,
  getScoringQuestionById,
  getScoringQuestionsByDimension,
  SCORING_DIMENSIONS,
  validateScoringQuestions,
} from '../src/training/scoringTrainingData.js';
import { shuffleQuestions } from '../src/training/trainingUtils.js';
import { recordScoringSession, getRecentScoringQuestionIds, getRecentScoringSessions } from '../src/training/trainingStore.js';

// ============ 题库结构测试 ============

test('维度打分题库总数至少 20 道', () => {
  assert.ok(scoringQuestions.length >= 20, `题目数应至少 20，实际 ${scoringQuestions.length}`);
});

test('每个维度至少 5 道题', () => {
  for (const [dimension, label] of Object.entries(SCORING_DIMENSIONS)) {
    const count = getScoringQuestionsByDimension(dimension).length;
    assert.ok(count >= 5, `${dimension}（${label}）应至少 5 道，实际 ${count}`);
  }
});

test('题目 ID 全局唯一', () => {
  const ids = new Set(scoringQuestions.map((q) => q.id));
  assert.equal(ids.size, scoringQuestions.length);
});

test('题目 ID 格式为 score-{dimension}-NNN', () => {
  for (const q of scoringQuestions) {
    assert.match(q.id, /^score-(layout|color|typography|whitespace)-\d{3}$/, `ID 格式错误: ${q.id}`);
  }
});

test('getScoringQuestionById 能取回每道题', () => {
  for (const q of scoringQuestions) {
    assert.equal(getScoringQuestionById(q.id)?.id, q.id);
  }
  assert.equal(getScoringQuestionById('not-exist'), null);
  assert.equal(getScoringQuestionById(null), null);
});

test('每道题场景非空', () => {
  for (const q of scoringQuestions) {
    assert.ok(typeof q.scenario === 'string' && q.scenario.length > 0, `${q.id} 场景为空`);
  }
});

test('每道题标题非空', () => {
  for (const q of scoringQuestions) {
    assert.ok(typeof q.title === 'string' && q.title.length > 0, `${q.id} 标题为空`);
  }
});

test('每道题图片为合法 SVG data URL', () => {
  for (const q of scoringQuestions) {
    assert.ok(typeof q.image === 'string' && q.image.startsWith('data:image/svg+xml'), `${q.id} 图片非合法 SVG data URL`);
  }
});

test('每道题图片非 Pexels/Unsplash 摄影图', () => {
  for (const q of scoringQuestions) {
    assert.ok(!q.image.startsWith('https://images.pexels.com'), `${q.id} 不应使用 Pexels 图片`);
    assert.ok(!q.image.startsWith('https://images.unsplash.com'), `${q.id} 不应使用 Unsplash 图片`);
  }
});

test('validateScoringQuestions 不应返回任何问题', () => {
  const issues = validateScoringQuestions();
  assert.deepEqual(issues, [], `题库校验失败: ${issues.join('; ')}`);
});

test('每道题有不同页面场景（同维度内场景不重复）', () => {
  for (const dimension of Object.keys(SCORING_DIMENSIONS)) {
    const dimQuestions = getScoringQuestionsByDimension(dimension);
    const scenarios = dimQuestions.map((q) => q.scenario);
    const unique = new Set(scenarios);
    assert.equal(unique.size, scenarios.length, `${dimension} 维度内场景重复`);
  }
});

test('四个评分维度都在 SCORING_DIMENSIONS 中定义', () => {
  const expected = ['layout', 'color', 'typography', 'whitespace'];
  assert.deepEqual(Object.keys(SCORING_DIMENSIONS).sort(), expected.sort());
});

test('每道题的 dimension 属于四个评分维度之一', () => {
  const allowed = Object.keys(SCORING_DIMENSIONS);
  for (const q of scoringQuestions) {
    assert.ok(allowed.includes(q.dimension), `${q.id} dimension 非法: ${q.dimension}`);
  }
});

// ============ 抽题采样逻辑测试 ============
// 复刻 training-scoring.js 中的 prepareScoringQuestions 算法（保持现有逻辑不修改）

function prepareScoringQuestionsReplica(list, count = 8, recentIds = []) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const recentSet = new Set(recentIds);
  const fresh = list.filter((q) => !recentSet.has(q.id));
  const candidates = fresh.length >= count ? fresh : list;
  const selected = [];
  for (const q of shuffleQuestions(candidates)) {
    if (selected.length >= count) break;
    const prev = selected[selected.length - 1];
    if (prev && prev.dimension === q.dimension && candidates.some((item) => item.dimension !== prev.dimension && !selected.includes(item))) {
      continue;
    }
    selected.push(q);
  }
  if (selected.length < count) {
    for (const q of shuffleQuestions(candidates)) {
      if (selected.length >= count) break;
      if (!selected.includes(q)) selected.push(q);
    }
  }
  return selected;
}

test('每轮抽 8 道题', () => {
  const picked = prepareScoringQuestionsReplica(scoringQuestions, 8, []);
  assert.equal(picked.length, 8);
});

test('当前轮次没有重复题目', () => {
  for (let i = 0; i < 10; i += 1) {
    const picked = prepareScoringQuestionsReplica(scoringQuestions, 8, []);
    const ids = picked.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, `第 ${i} 轮出现重复题目`);
  }
});

test('排除冷却期内的题目', () => {
  // 题库共 20 道，冷却 12 道后仍剩 8 道可选
  const recent = scoringQuestions.slice(0, 12).map((q) => q.id);
  const picked = prepareScoringQuestionsReplica(scoringQuestions, 8, recent);
  assert.equal(picked.length, 8);
  for (const q of picked) {
    assert.ok(!recent.includes(q.id), `${q.id} 不应出现（处于冷却期）`);
  }
});

test('冷却题超过题库容量时仍能返回 8 道（回退全题库）', () => {
  const recent = scoringQuestions.slice(0, scoringQuestions.length - 5).map((q) => q.id);
  const picked = prepareScoringQuestionsReplica(scoringQuestions, 8, recent);
  assert.equal(picked.length, 8);
});

test('抽题结果避免连续相同维度（在维度种类足够时）', () => {
  let violationCount = 0;
  for (let i = 0; i < 30; i += 1) {
    const picked = prepareScoringQuestionsReplica(scoringQuestions, 8, []);
    for (let j = 1; j < picked.length; j += 1) {
      if (picked[j].dimension === picked[j - 1].dimension) violationCount += 1;
    }
  }
  assert.ok(violationCount < 30, `连续相同维度出现次数过多: ${violationCount}`);
});

// ============ store 持久化测试 ============

const SCORING_STORAGE_KEY = 'training-scoring-state-v1';

function setScoringStorage(state) {
  globalThis.localStorage = {
    getItem: (key) => (key === SCORING_STORAGE_KEY ? JSON.stringify(state) : null),
    setItem: (key, value) => {
      if (key === SCORING_STORAGE_KEY) globalThis._scoringStored = value;
    },
    removeItem: () => {},
  };
}

function clearScoringStorage() {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: (key, value) => {
      if (key === SCORING_STORAGE_KEY) globalThis._scoringStored = value;
    },
    removeItem: () => {},
  };
  globalThis._scoringStored = null;
}

test('recordScoringSession 保存会话并记录各维度平均分', () => {
  clearScoringStorage();
  const answers = [
    {
      questionId: 'score-layout-001',
      dimension: 'layout',
      userScores: { layout: 7, color: 8, typography: 6, whitespace: 7 },
      aiScores: { layout: 5, color: 7, typography: 8, whitespace: 6 },
      scoreDifference: 8,
      weakestDimension: 'typography',
      completedAt: Date.now(),
    },
    {
      questionId: 'score-color-001',
      dimension: 'color',
      userScores: { layout: 6, color: 9, typography: 7, whitespace: 6 },
      aiScores: { layout: 6, color: 7, typography: 7, whitespace: 6 },
      scoreDifference: 2,
      weakestDimension: 'whitespace',
      completedAt: Date.now(),
    },
  ];
  const record = recordScoringSession({ startedAt: Date.now(), finishedAt: Date.now(), answers });
  assert.equal(record.total, 2);
  assert.equal(record.dimensionStats.layout.userAvg, 6.5);
  assert.equal(record.dimensionStats.color.userAvg, 8.5);
  assert.equal(record.dimensionStats.layout.aiAvg, 5.5);
  // layout 平均差值：(7-5) + (6-6) = 2 / 2 = 1
  assert.equal(record.dimensionStats.layout.avgDiff, 1);
  // color 平均差值：(8-7) + (9-7) = 3 / 2 = 1.5
  assert.equal(record.dimensionStats.color.avgDiff, 1.5);
});

test('recordScoringSession 计算最容易高估/低估的维度', () => {
  clearScoringStorage();
  const answers = [
    {
      questionId: 'score-color-001',
      dimension: 'color',
      userScores: { layout: 7, color: 9, typography: 7, whitespace: 7 },
      aiScores: { layout: 7, color: 5, typography: 7, whitespace: 7 },
      scoreDifference: 4,
      weakestDimension: 'color',
      completedAt: Date.now(),
    },
  ];
  const record = recordScoringSession({ startedAt: 0, finishedAt: 0, answers });
  // color 平均差值 = 9-5 = 4（最大），方向为高估
  assert.equal(record.biasedDimension, 'color');
  assert.equal(record.biasDirection, 'overestimate');
});

test('recordScoringSession 低估方向判定', () => {
  clearScoringStorage();
  const answers = [
    {
      questionId: 'score-typography-001',
      dimension: 'typography',
      userScores: { layout: 7, color: 7, typography: 3, whitespace: 7 },
      aiScores: { layout: 7, color: 7, typography: 8, whitespace: 7 },
      scoreDifference: 5,
      weakestDimension: 'typography',
      completedAt: Date.now(),
    },
  ];
  const record = recordScoringSession({ startedAt: 0, finishedAt: 0, answers });
  assert.equal(record.biasedDimension, 'typography');
  assert.equal(record.biasDirection, 'underestimate');
});

test('getRecentScoringQuestionIds 读取最近做过的题目 id', () => {
  const state = {
    history: [{ questionIds: ['score-layout-001', 'score-color-001'] }],
    stats: {},
  };
  setScoringStorage(state);
  const recent = getRecentScoringQuestionIds(20);
  assert.equal(recent.length, 2);
  assert.ok(recent.includes('score-layout-001'));
  clearScoringStorage();
});

test('getRecentScoringSessions 返回倒序历史记录', () => {
  const state = {
    history: [
      { questionIds: ['a'], completedAt: '2024-01-01' },
      { questionIds: ['b'], completedAt: '2024-01-02' },
    ],
    stats: {},
  };
  setScoringStorage(state);
  const sessions = getRecentScoringSessions(20);
  assert.equal(sessions.length, 2);
  // 倒序：最新的在前
  assert.deepEqual(sessions[0].questionIds, ['b']);
  clearScoringStorage();
});

test('store 与好坏对比训练隔离（使用独立 storage key）', () => {
  clearScoringStorage();
  // 维度打分 store 不应读写好坏对比的 key
  assert.equal(globalThis.localStorage.getItem('training-state-v1'), null);
  recordScoringSession({ startedAt: 0, finishedAt: 0, answers: [] });
  // 确认写入的是 scoring 专用 key
  assert.ok(globalThis._scoringStored != null);
  clearScoringStorage();
});

test('store 与找茬训练隔离（使用独立 storage key）', () => {
  clearScoringStorage();
  assert.equal(globalThis.localStorage.getItem('training-spot-state-v1'), null);
  recordScoringSession({ startedAt: 0, finishedAt: 0, answers: [] });
  assert.ok(globalThis._scoringStored != null);
  clearScoringStorage();
});
