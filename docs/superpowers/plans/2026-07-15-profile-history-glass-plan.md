# 个人中心与历史记录 Apple Glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 localStorage 建立训练与诊断历史，完善个人中心、历史页面、删除交互和蓝色 Apple Glass 动效。

**Architecture:** 新增统一的 `profileStore.js` 负责版本化 localStorage、容错读写、聚合统计和删除；训练与诊断完成时写入记录；`profile.js` 和 `history.js` 只消费 store，不直接操作其他业务状态。共享玻璃卡片和转场样式放在 `index.html`，保持原生 JS SPA 架构。

**Tech Stack:** Vite 4、原生 JavaScript、Tailwind CDN、localStorage、Lucide。

## Global Constraints

- 主色保持蓝色，不改为黑色主题。
- 卡片采用浅色 Apple Glass：半透明白色、蓝色阴影、`backdrop-filter: blur(18px)`。
- 不引入 React/Vue/新 UI 框架。
- localStorage 损坏、不可用或字段不完整时必须回退为空状态，不得白屏。
- 单条删除、清空全部、取消删除必须可用。
- `prefers-reduced-motion: reduce` 时关闭位移、缩放和错峰动画。

---

### Task 1: 统一历史数据层

**Files:**
- Create: `web/src/profileStore.js`
- Modify: `web/src/training/trainingStore.js`
- Modify: `web/src/taskStore.js`
- Test: `web/test/profileStore.test.js`

**Interfaces:**
- Produces `addTrainingRecord(record)`, `addDiagnosisRecord(record)`, `getAllHistory()`, `getHistoryByType(type)`, `deleteHistoryRecord(id)`, `clearHistory(type)`, `getProfileStats()`。
- `getProfileStats()` 返回 `{ trainingCount, diagnosisCount, averageScore, dimensions, recent }`。

- [ ] **Step 1: Write tests** for empty storage, malformed JSON, add/read, per-type delete, clear, and aggregate dimensions.
- [ ] **Step 2: Run `npm test` and verify the new tests fail before implementation.**
- [ ] **Step 3: Implement versioned keys `meishang.profile.training.v1`, `meishang.profile.diagnosis.v1`; wrap every storage operation in try/catch; generate IDs with timestamp plus random suffix; sort records newest first.
- [ ] **Step 4: Add adapters from scoring/spot session records so existing training data is preserved and new completion writes use the unified schema.
- [ ] **Step 5: Run `npm test` and verify all tests pass.**

### Task 2: 训练与诊断完成时写入历史

**Files:**
- Modify: `web/src/pages/training-scoring.js`
- Modify: `web/src/pages/training-spot.js`
- Modify: `web/src/pages/diagnosis-report.js`
- Test: `web/test/profileStore.test.js`

**Interfaces:** Consume Task 1 store functions; records include `id`, `type`, `createdAt`, `title`, `score`, `summary`, and type-specific `meta`.

- [ ] **Step 1: Add tests proving one completion creates exactly one record and repeated render does not duplicate it.**
- [ ] **Step 2: Write the minimal completion hooks: scoring uses average score and dimensions; spot uses total score and dimension summary; diagnosis uses reportId/provider/scores.**
- [ ] **Step 3: Add dedupe keys based on session/report ID.**
- [ ] **Step 4: Run focused tests, then `npm test`.**

### Task 3: Personal center

**Files:**
- Modify: `web/src/pages/profile.js`
- Modify: `web/src/main.js`
- Test: `web/test/profilePage.test.js`

- [ ] **Step 1: Add tests for empty state, populated stats, weakest dimension, and record action URLs.**
- [ ] **Step 2: Replace the placeholder with a responsive page containing overview metrics, four dimension bars, training progress cards, recent history, diagnosis history, and empty-state CTAs.**
- [ ] **Step 3: Use event delegation for view/delete/clear actions; never mutate storage directly from templates.**
- [ ] **Step 4: Add deletion confirmation modal and success/error feedback.**
- [ ] **Step 5: Run `npm test` and verify `/profile` builds without errors.**

### Task 4: Unified history page

**Files:**
- Modify: `web/src/pages/history.js`
- Modify: `web/src/router.js` only if a record detail route is required
- Test: `web/test/historyPage.test.js`

- [ ] **Step 1: Add tests for type filters, newest-first order, single delete, clear-all confirmation, and missing record fallback.**
- [ ] **Step 2: Render filter chips for 全部/训练/诊断; render glass list cards with title, score, type, time, view, and delete actions.**
- [ ] **Step 3: Add modal confirmation for deletion and clear-all; cancel must leave storage unchanged.**
- [ ] **Step 4: Link records to their existing result/report routes and show a friendly expired-record page when the target is unavailable.**
- [ ] **Step 5: Run focused tests and `npm test`.**

### Task 5: Blue Apple Glass visual system and transitions

**Files:**
- Modify: `web/index.html`
- Modify: `web/src/main.js`
- Modify: `web/src/pages/profile.js`
- Modify: `web/src/pages/history.js`
- Test: `web/test/uiMotion.test.js`

- [ ] **Step 1: Add tests that assert shared glass class/style hooks and reduced-motion CSS are present.**
- [ ] **Step 2: Add shared CSS variables/classes for blue glass cards, modal backdrop blur, staggered reveal, list removal, and route fade transitions.**
- [ ] **Step 3: Add route transition lifecycle that fades the old content out and the new content in without blocking navigation or breaking browser back.**
- [ ] **Step 4: Add `prefers-reduced-motion` overrides that remove translate/scale and shorten opacity transitions.**
- [ ] **Step 5: Verify desktop and narrow viewport layout manually, then run `npm run build` and `npm test`.**

### Task 6: Final acceptance

**Files:** No new files; verify all changed files.

- [ ] **Step 1: Start frontend and visit `/profile`, `/history`, `/training`, and diagnosis report routes.**
- [ ] **Step 2: Complete one scoring session, one spot session, and one diagnosis; verify all three appear after refresh.**
- [ ] **Step 3: Delete one record, cancel one deletion, and clear one category; verify unrelated records remain.**
- [ ] **Step 4: Test malformed localStorage JSON and verify empty-state rendering instead of a blank page.**
- [ ] **Step 5: Run `npm run build` and `npm test`; acceptance requires zero failures.**
