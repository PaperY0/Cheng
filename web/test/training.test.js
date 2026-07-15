// 审美训练题库与采样逻辑测试
// 运行：在 web/ 目录下执行 `npm test`
// 覆盖：题库数量、维度分布、ID 唯一性、layoutIndex 范围、
//       validateQuestions、SVG 样本生成、抽题冷却与维度多样性

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  questions,
  getQuestionById,
  TRAINING_DIMENSIONS,
  validateQuestions,
} from '../src/training/trainingData.js';
import { getTrainingFixtureImage } from '../src/training/trainingFixtures.js';
import { shuffleQuestions } from '../src/training/trainingUtils.js';

// ============ 题库结构测试 ============

test('题库总数为 80 道（4 维度 × 20 场景）', () => {
  assert.equal(questions.length, 80);
});

test('每个维度恰好 20 道题', () => {
  for (const [dimension, label] of Object.entries(TRAINING_DIMENSIONS)) {
    const count = questions.filter((q) => q.dimension === dimension).length;
    assert.equal(count, 20, `${dimension}（${label}）应为 20 道，实际 ${count}`);
  }
});

test('题目 ID 全局唯一', () => {
  const ids = new Set(questions.map((q) => q.id));
  assert.equal(ids.size, questions.length);
});

test('题目 ID 格式为 dimension-NNN', () => {
  for (const q of questions) {
    assert.match(q.id, /^(contrast|alignment|repetition|proximity)-\d{3}$/, `ID 格式错误: ${q.id}`);
  }
});

test('getQuestionById 能取回每道题', () => {
  for (const q of questions) {
    const found = getQuestionById(q.id);
    assert.equal(found?.id, q.id);
  }
  assert.equal(getQuestionById('not-exist'), null);
  assert.equal(getQuestionById(null), null);
});

test('layoutIndex 在 0-9 范围内', () => {
  for (const q of questions) {
    assert.ok(
      Number.isInteger(q.layoutIndex) && q.layoutIndex >= 0 && q.layoutIndex <= 9,
      `${q.id} layoutIndex 越界: ${q.layoutIndex}`,
    );
  }
});

test('每道题 layoutIndex = scenarioIndex % 10（与场景一一对应）', () => {
  // 同一维度内，前 10 道题应分别使用 0-9 不同 layoutIndex
  for (const dimension of Object.keys(TRAINING_DIMENSIONS)) {
    const dimQuestions = questions.filter((q) => q.dimension === dimension);
    const firstTen = dimQuestions.slice(0, 10).map((q) => q.layoutIndex);
    assert.deepEqual(firstTen, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], `${dimension} 前 10 道 layoutIndex 应为 0-9`);
  }
});

test('每道题场景非空', () => {
  for (const q of questions) {
    assert.ok(typeof q.scenario === 'string' && q.scenario.length > 0, `${q.id} 场景为空`);
  }
});

test('每道题 answer 必须存在于 options 中', () => {
  for (const q of questions) {
    const optionIds = q.options.map((o) => o.id);
    assert.ok(optionIds.includes(q.answer), `${q.id} 答案不在选项中`);
  }
});

test('每道题解析（correct/wrong/rule）完整', () => {
  for (const q of questions) {
    assert.ok(q.explanation?.correct, `${q.id} 缺少 correct`);
    assert.ok(q.explanation?.wrong, `${q.id} 缺少 wrong`);
    assert.ok(q.explanation?.rule, `${q.id} 缺少 rule`);
  }
});

test('validateQuestions 不应返回任何问题', () => {
  const issues = validateQuestions();
  assert.deepEqual(issues, [], `题库校验失败: ${issues.join('; ')}`);
});

test('goodOption 与 answer 一致', () => {
  for (const q of questions) {
    assert.equal(q.goodOption, q.answer, `${q.id} goodOption 与 answer 不一致`);
  }
});

// ============ SVG 样本生成测试 ============

test('getTrainingFixtureImage 返回合法的 SVG data URL', () => {
  for (const q of questions) {
    for (const option of q.options) {
      const url = getTrainingFixtureImage(q, option.id);
      assert.ok(typeof url === 'string' && url.startsWith('data:image/svg+xml'), `${q.id}:${option.id} 非合法 data URL`);
    }
  }
});

test('同一题的 A 与 B 图片内容必须不同', () => {
  for (const q of questions) {
    const a = getTrainingFixtureImage(q, 'a');
    const b = getTrainingFixtureImage(q, 'b');
    assert.notEqual(a, b, `${q.id} A/B 图片相同`);
  }
});

test('goodOption 对应的图片应与 bad option 不同', () => {
  for (const q of questions) {
    const good = getTrainingFixtureImage(q, q.goodOption);
    const badOption = q.options.find((o) => o.id !== q.goodOption).id;
    const bad = getTrainingFixtureImage(q, badOption);
    assert.notEqual(good, bad, `${q.id} good/bad 图片相同`);
  }
});

test('兼容路径（字符串 questionId）与对象路径输出一致', () => {
  // 修复后的兼容路径必须与对象路径返回相同 SVG
  for (const q of questions) {
    const objectUrl = getTrainingFixtureImage(q, 'a');
    const stringUrl = getTrainingFixtureImage(q.id, 'a');
    assert.equal(objectUrl, stringUrl, `${q.id} 兼容路径与对象路径不一致`);
  }
});

// ============ 工具函数测试 ============

test('shuffleQuestions 保留全部元素且不改原数组', () => {
  const original = questions.map((q) => q.id);
  const list = [...questions];
  const shuffled = shuffleQuestions(list);
  assert.equal(shuffled.length, questions.length);
  assert.deepEqual([...shuffled].map((q) => q.id).sort(), [...original].sort());
  // 原数组未被修改
  assert.deepEqual(list.map((q) => q.id), original);
});

test('shuffleQuestions 非法输入返回空数组', () => {
  assert.deepEqual(shuffleQuestions(null), []);
  assert.deepEqual(shuffleQuestions([]), []);
  assert.deepEqual(shuffleQuestions('abc'), []);
});

// ============ 抽题采样逻辑测试 ============
// 此处复刻 training.js 中的 prepareQuestions 算法（保持现有答题逻辑不修改），
// 验证：8 道/轮、排除最近 20 道、避免连续相同维度、选项随机排序后 answer 仍可定位。

const STORAGE_KEY = 'training-state-v1';

function mockRecentIds(ids) {
  // 模拟 trainingStore.getRecentQuestionIds 的输入：构造一个 history 结构
  const state = { history: [{ questionIds: ids, wrongQuestionIds: [] }], wrongQuestions: {}, stats: {} };
  globalThis.localStorage = {
    getItem: (key) => (key === STORAGE_KEY ? JSON.stringify(state) : null),
    setItem: () => {},
    removeItem: () => {},
  };
}

function clearMockStorage() {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

// 复刻 training.js prepareQuestions 逻辑（不改原模块）
function prepareQuestionsReplica(list, count = 8, recentIds = []) {
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
  return selected.map((q, index) => {
    const correct = q.options.find((o) => o.id === q.answer);
    const wrong = q.options.find((o) => o.id !== q.answer);
    const ordered = index % 2 === 0 ? [correct, wrong] : [wrong, correct];
    return {
      ...q,
      options: ordered.map((o, i) => ({ ...o, label: i === 0 ? 'A' : 'B' })),
    };
  }).filter((q) => q.options.every(Boolean));
}

test('每轮抽 8 道题', () => {
  clearMockStorage();
  const picked = prepareQuestionsReplica(questions, 8, []);
  assert.equal(picked.length, 8);
});

test('排除最近 20 道冷却题', () => {
  // 取前 20 道 ID 作为冷却
  const recent = questions.slice(0, 20).map((q) => q.id);
  const picked = prepareQuestionsReplica(questions, 8, recent);
  assert.equal(picked.length, 8);
  for (const q of picked) {
    assert.ok(!recent.includes(q.id), `${q.id} 不应出现在本轮（处于冷却期）`);
  }
});

test('冷却题超过 60 道时仍能返回 8 道（回退到全题库）', () => {
  const recent = questions.slice(0, 70).map((q) => q.id);
  const picked = prepareQuestionsReplica(questions, 8, recent);
  assert.equal(picked.length, 8);
});

test('抽题结果避免连续相同维度（在维度种类足够时）', () => {
  clearMockStorage();
  // 多次抽样，检查是否存在连续相同维度（4 维度足够分散时不应出现）
  let violationCount = 0;
  for (let i = 0; i < 30; i += 1) {
    const picked = prepareQuestionsReplica(questions, 8, []);
    for (let j = 1; j < picked.length; j += 1) {
      if (picked[j].dimension === picked[j - 1].dimension) violationCount += 1;
    }
  }
  // 4 维度足够多样，连续相同维度的次数应很少（允许少量，因算法在尾段会回填）
  assert.ok(violationCount < 30, `连续相同维度出现次数过多: ${violationCount}`);
});

test('抽题结果对选项做了 A/B 随机排序，但 answer 字段仍能正确定位正确选项', () => {
  clearMockStorage();
  const picked = prepareQuestionsReplica(questions, 8, []);
  for (const q of picked) {
    // options 重新被赋予 A/B label
    assert.equal(q.options.length, 2);
    assert.equal(q.options[0].label, 'A');
    assert.equal(q.options[1].label, 'B');
    // answer 字段仍是原始 option.id（'a' 或 'b'），与 options 中某一项 id 对应
    const matched = q.options.find((o) => o.id === q.answer);
    assert.ok(matched, `${q.id} answer 在排序后 options 中找不到`);
  }
});

test('getRecentQuestionIds 从 trainingStore 读取（依赖 localStorage mock）', async () => {
  // 动态导入 trainingStore 以验证集成
  mockRecentIds(questions.slice(0, 20).map((q) => q.id));
  const { getRecentQuestionIds } = await import('../src/training/trainingStore.js');
  const recent = getRecentQuestionIds(20);
  assert.equal(recent.length, 20);
  clearMockStorage();
});
