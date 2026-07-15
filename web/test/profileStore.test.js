import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  #data = new Map();

  getItem(key) {
    return this.#data.has(key) ? this.#data.get(key) : null;
  }

  setItem(key, value) {
    this.#data.set(key, String(value));
  }

  removeItem(key) {
    this.#data.delete(key);
  }

  clear() {
    this.#data.clear();
  }
}

globalThis.localStorage = new MemoryStorage();

const { getAllHistory, clearHistory, deleteHistoryRecord } = await import('../src/profileStore.js');
const { renderHome } = await import('../src/pages/home.js');

function setRecentDiagnoses(records) {
  localStorage.setItem('meishang.recentDiagnoses', JSON.stringify(records));
}

function diagnosis(taskId, generatedAt) {
  return {
    taskId,
    name: `${taskId}.png`,
    score: 7,
    generatedAt,
    provider: 'mock',
    report: { scores: { layout: 7 } },
  };
}

test('清空历史后，旧的诊断来源记录不会被自动重新导入', () => {
  localStorage.clear();
  setRecentDiagnoses([diagnosis('old-task', '2026-07-15T10:00:00.000Z')]);

  assert.equal(getAllHistory().length, 1);
  assert.equal(clearHistory(), true);
  assert.equal(getAllHistory().length, 0);
  assert.doesNotMatch(renderHome(), /old-task\.png/);

  setRecentDiagnoses([
    diagnosis('future-task', new Date(Date.now() + 60_000).toISOString()),
    diagnosis('old-task', '2026-07-15T10:00:00.000Z'),
  ]);
  assert.deepEqual(getAllHistory().map((item) => item.id), ['diagnosis-future-task']);
});

test('删除历史后，来源记录不会在下一次读取时重新出现', () => {
  localStorage.clear();
  setRecentDiagnoses([diagnosis('deleted-task', new Date().toISOString())]);

  assert.equal(getAllHistory().length, 1);
  assert.equal(deleteHistoryRecord('diagnosis-deleted-task'), true);
  assert.equal(getAllHistory().length, 0);
});
