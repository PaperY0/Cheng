// 找茬训练题库与采样逻辑测试
// 运行：在 web/ 目录下执行 `npm test`
// 覆盖：题目数量、维度分布、ID 唯一性、热点坐标合法性、热点不全部重叠、
//       validateSpotQuestions、抽题冷却与维度多样性、store 持久化。

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  spotQuestions,
  getSpotQuestionById,
  getSpotQuestionsByDimension,
  SPOT_DIMENSIONS,
  validateSpotQuestions,
} from '../src/training/spotTrainingData.js';
import { shuffleQuestions } from '../src/training/trainingUtils.js';
import { recordSpotSession, getRecentSpotQuestionIds, getRecentSpotSessions } from '../src/training/trainingStore.js';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;

// ============ 题库结构测试 ============

test('找茬题库总数至少 20 道', () => {
  assert.ok(spotQuestions.length >= 20, `题目数应至少 20，实际 ${spotQuestions.length}`);
});

test('每个维度至少 5 道题', () => {
  for (const [dimension, label] of Object.entries(SPOT_DIMENSIONS)) {
    const count = getSpotQuestionsByDimension(dimension).length;
    assert.ok(count >= 5, `${dimension}（${label}）应至少 5 道，实际 ${count}`);
  }
});

test('题目 ID 全局唯一', () => {
  const ids = new Set(spotQuestions.map((q) => q.id));
  assert.equal(ids.size, spotQuestions.length);
});

test('题目 ID 格式为 spot-dimension-NNN', () => {
  for (const q of spotQuestions) {
    assert.match(q.id, /^spot-(contrast|alignment|repetition|proximity)-\d{3}$/, `ID 格式错误: ${q.id}`);
  }
});

test('getSpotQuestionById 能取回每道题', () => {
  for (const q of spotQuestions) {
    assert.equal(getSpotQuestionById(q.id)?.id, q.id);
  }
  assert.equal(getSpotQuestionById('not-exist'), null);
  assert.equal(getSpotQuestionById(null), null);
});

test('每道题场景非空', () => {
  for (const q of spotQuestions) {
    assert.ok(typeof q.scenario === 'string' && q.scenario.length > 0, `${q.id} 场景为空`);
  }
});

test('每道题至少 2 个热点区域', () => {
  for (const q of spotQuestions) {
    assert.ok(Array.isArray(q.hotspots) && q.hotspots.length >= 2, `${q.id} 热点应至少 2 个`);
  }
});

test('热点坐标必须落在 960×600 画布范围内', () => {
  for (const q of spotQuestions) {
    for (const h of q.hotspots) {
      assert.ok(h.x >= 0 && h.y >= 0, `${q.id}/${h.id} 坐标为负`);
      assert.ok(h.x + h.width <= CANVAS_WIDTH, `${q.id}/${h.id} x+width 越界: ${h.x + h.width}`);
      assert.ok(h.y + h.height <= CANVAS_HEIGHT, `${q.id}/${h.id} y+height 越界: ${h.y + h.height}`);
      assert.ok(h.width > 0 && h.height > 0, `${q.id}/${h.id} 宽高非正`);
    }
  }
});

test('热点信息完整（issue/principle/explanation/suggestion）', () => {
  for (const q of spotQuestions) {
    for (const h of q.hotspots) {
      assert.ok(h.issue, `${q.id}/${h.id} 缺少 issue`);
      assert.ok(h.principle, `${q.id}/${h.id} 缺少 principle`);
      assert.ok(h.explanation, `${q.id}/${h.id} 缺少 explanation`);
      assert.ok(h.suggestion, `${q.id}/${h.id} 缺少 suggestion`);
    }
  }
});

test('同一题热点之间不能全部重叠', () => {
  for (const q of spotQuestions) {
    if (q.hotspots.length < 2) continue;
    let allOverlap = true;
    for (let i = 0; i < q.hotspots.length; i += 1) {
      for (let j = i + 1; j < q.hotspots.length; j += 1) {
        const a = q.hotspots[i];
        const b = q.hotspots[j];
        const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
        const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
        if (!overlapX || !overlapY) {
          allOverlap = false;
          break;
        }
      }
      if (!allOverlap) break;
    }
    assert.ok(!allOverlap, `${q.id} 热点全部重叠`);
  }
});

test('每道题图片为合法 SVG data URL', () => {
  for (const q of spotQuestions) {
    assert.ok(typeof q.image === 'string' && q.image.startsWith('data:image/svg+xml'), `${q.id} 图片非合法 data URL`);
  }
});

test('validateSpotQuestions 不应返回任何问题', () => {
  const issues = validateSpotQuestions();
  assert.deepEqual(issues, [], `题库校验失败: ${issues.join('; ')}`);
});

test('每道题有不同页面场景（同维度内场景不重复）', () => {
  for (const dimension of Object.keys(SPOT_DIMENSIONS)) {
    const dimQuestions = getSpotQuestionsByDimension(dimension);
    const scenarios = dimQuestions.map((q) => q.scenario);
    const unique = new Set(scenarios);
    assert.equal(unique.size, scenarios.length, `${dimension} 维度内场景重复`);
  }
});

// ============ 抽题采样逻辑测试 ============
// 复刻 training-spot.js 中的 prepareSpotQuestions 算法（保持现有逻辑不修改）

function prepareSpotQuestionsReplica(list, count = 8, recentIds = []) {
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
  const picked = prepareSpotQuestionsReplica(spotQuestions, 8, []);
  assert.equal(picked.length, 8);
});

test('当前轮次没有重复题目', () => {
  for (let i = 0; i < 10; i += 1) {
    const picked = prepareSpotQuestionsReplica(spotQuestions, 8, []);
    const ids = picked.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, `第 ${i} 轮出现重复题目`);
  }
});

test('排除冷却期内的题目', () => {
  // 题库共 20 道，冷却 12 道后仍剩 8 道可选
  const recent = spotQuestions.slice(0, 12).map((q) => q.id);
  const picked = prepareSpotQuestionsReplica(spotQuestions, 8, recent);
  assert.equal(picked.length, 8);
  for (const q of picked) {
    assert.ok(!recent.includes(q.id), `${q.id} 不应出现（处于冷却期）`);
  }
});

test('冷却题超过题库容量时仍能返回 8 道（回退全题库）', () => {
  const recent = spotQuestions.slice(0, spotQuestions.length - 5).map((q) => q.id);
  const picked = prepareSpotQuestionsReplica(spotQuestions, 8, recent);
  assert.equal(picked.length, 8);
});

test('抽题结果避免连续相同维度（在维度种类足够时）', () => {
  let violationCount = 0;
  for (let i = 0; i < 30; i += 1) {
    const picked = prepareSpotQuestionsReplica(spotQuestions, 8, []);
    for (let j = 1; j < picked.length; j += 1) {
      if (picked[j].dimension === picked[j - 1].dimension) violationCount += 1;
    }
  }
  assert.ok(violationCount < 30, `连续相同维度出现次数过多: ${violationCount}`);
});

// ============ store 持久化测试 ============

const SPOT_STORAGE_KEY = 'training-spot-state-v1';

function setSpotStorage(state) {
  globalThis.localStorage = {
    getItem: (key) => (key === SPOT_STORAGE_KEY ? JSON.stringify(state) : null),
    setItem: (key, value) => {
      if (key === SPOT_STORAGE_KEY) globalThis._spotStored = value;
    },
    removeItem: () => {},
  };
}

function clearSpotStorage() {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: (key, value) => {
      if (key === SPOT_STORAGE_KEY) globalThis._spotStored = value;
    },
    removeItem: () => {},
  };
  globalThis._spotStored = null;
}

test('recordSpotSession 保存会话并记录各维度得分', () => {
  clearSpotStorage();
  const answers = [
    { questionId: 'spot-contrast-001', dimension: 'contrast', foundHotspotIds: ['h1', 'h2'], missedHotspotIds: [], wrongClickCount: 1, score: 95, completedAt: Date.now() },
    { questionId: 'spot-alignment-001', dimension: 'alignment', foundHotspotIds: ['h1'], missedHotspotIds: ['h2'], wrongClickCount: 2, score: 40, completedAt: Date.now() },
  ];
  const record = recordSpotSession({ startedAt: Date.now(), finishedAt: Date.now(), answers });
  assert.equal(record.total, 2);
  assert.equal(record.totalScore, 135);
  assert.equal(record.totalFound, 3);
  assert.equal(record.totalMissed, 1);
  assert.equal(record.totalWrongClicks, 3);
  assert.equal(record.dimensionStats.alignment.score, 40);
  assert.equal(record.weakestDimension, 'alignment');
});

test('getRecentSpotQuestionIds 读取最近做过的题目 id', () => {
  const state = {
    history: [{ questionIds: ['spot-contrast-001', 'spot-contrast-002'] }],
    stats: {},
  };
  setSpotStorage(state);
  const recent = getRecentSpotQuestionIds(20);
  assert.equal(recent.length, 2);
  assert.ok(recent.includes('spot-contrast-001'));
  clearSpotStorage();
});

test('getRecentSpotSessions 返回倒序历史记录', () => {
  const state = {
    history: [
      { questionIds: ['a'], completedAt: '2024-01-01' },
      { questionIds: ['b'], completedAt: '2024-01-02' },
    ],
    stats: {},
  };
  setSpotStorage(state);
  const sessions = getRecentSpotSessions(20);
  assert.equal(sessions.length, 2);
  // 倒序：最新的在前
  assert.deepEqual(sessions[0].questionIds, ['b']);
  clearSpotStorage();
});

test('store 与好坏对比训练隔离（使用独立 storage key）', () => {
  clearSpotStorage();
  // 找茬 store 不应读写好坏对比的 key
  assert.equal(globalThis.localStorage.getItem('training-state-v1'), null);
  recordSpotSession({ startedAt: 0, finishedAt: 0, answers: [] });
  // 确认写入的是 spot 专用 key
  assert.ok(globalThis._spotStored != null);
  clearSpotStorage();
});
