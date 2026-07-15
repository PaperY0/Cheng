// 找茬训练页 - 观察设计图并从多选项中识别问题
// 纯前端实现：不调用任何后端 API 或 AI 服务
// 状态机：question → submitted → (next | finished) | error

import { spotQuestions, SPOT_DIMENSIONS } from '../training/spotTrainingData.js';
import { shuffleQuestions } from '../training/trainingUtils.js';
import { recordSpotSession, getRecentSpotQuestionIds } from '../training/trainingStore.js';

const CONTAINER_ID = 'training-spot-app';
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;

// 模块级状态
let state = createInitialState();
let shuffledQuestions = [];
let spotMounted = false;
let optionsByQuestionId = new Map();

function createInitialState() {
  return {
    status: 'question', // question | submitted | finished | error
    questionIndex: 0,
    foundHotspotIds: [], // 已发现的正确热点 id
    selectedOptionIds: [],
    wrongClickCount: 0,
    answers: [], // [{ questionId, dimension, foundHotspotIds, missedHotspotIds, wrongClickCount, score, completedAt }]
    startedAt: Date.now(),
    errorMessage: '',
  };
}

/* ============ 渲染入口 ============ */

export function renderTrainingSpot() {
  try {
    shuffledQuestions = prepareSpotQuestions(spotQuestions, 8);
    optionsByQuestionId = new Map();
    if (shuffledQuestions.length === 0) {
      state = createInitialState();
      state.status = 'error';
      state.errorMessage = '暂无可用题目';
    } else {
      state = createInitialState();
    }
  } catch (e) {
    console.error('[spot-training] 题目加载失败', e);
    state = createInitialState();
    state.status = 'error';
    state.errorMessage = '题目加载失败，请刷新重试';
  }

  return `
  <section class="mx-auto max-w-[1280px] px-6" style="padding-top:32px;padding-bottom:96px;">
    <div id="${CONTAINER_ID}">${renderContent()}</div>
    <p class="text-center text-xs" style="margin-top:20px;color:var(--muted-foreground);">
      观察左侧设计图，在右侧多选设计问题
    </p>
  </section>`;
}

function renderContent() {
  if (state.status === 'error') return renderError(state.errorMessage);
  if (state.status === 'finished') return renderResult();
  return renderQuestion();
}

/* ============ 题目渲染 ============ */

function renderQuestion() {
  const q = shuffledQuestions[state.questionIndex];
  if (!q || !q.image || !Array.isArray(q.hotspots) || q.hotspots.length === 0) {
    return renderError('题目数据异常，请刷新重试');
  }

  const total = shuffledQuestions.length;
  const current = state.questionIndex + 1;
  const progressPct = (current / total) * 100;
  const isSubmitted = state.status === 'submitted';
  const foundIds = state.foundHotspotIds;

  // 顶部栏
  const headerHtml = `
  <div class="flex items-center justify-between" style="margin-bottom:24px;">
    <a href="/training" data-link="/training" class="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">
      <i data-lucide="arrow-left" class="w-4 h-4"></i>
      <span>返回</span>
    </a>
    <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:20px;color:var(--foreground);letter-spacing:-0.02em;">找茬训练</h1>
    <span class="text-sm" style="color:var(--muted-foreground);">第 ${current} / ${total} 题</span>
  </div>`;

  // 进度条
  const progressHtml = `
  <div class="h-1.5 rounded-full overflow-hidden" style="margin-bottom:24px;background:var(--secondary);">
    <div class="h-full rounded-full" style="width:${progressPct}%;background:linear-gradient(90deg,#007aff,#5ac8fa);transition:width 0.3s ease;"></div>
  </div>`;

  // 题目信息
  const dimLabel = SPOT_DIMENSIONS[q.dimension] || q.dimension;
  const questionHtml = `
  <div class="rounded-full px-3 py-1 text-xs font-medium inline-block" style="margin-bottom:12px;background:rgba(0,122,255,0.1);color:#007aff;">${escapeHtml(dimLabel)} · ${escapeHtml(q.scenario)}</div>
  <h2 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);letter-spacing:-0.02em;margin-bottom:8px;">${escapeHtml(q.title)}</h2>
  <p class="text-sm" style="color:var(--muted-foreground);margin-bottom:16px;">观察左侧设计图，在右侧选出你认为存在的问题；每题有 ${q.hotspots.length} 个正确问题。</p>`;

  // 图片 + 热点
  const imageHtml = renderImageWithHotspots(q, isSubmitted, foundIds);
  const optionsHtml = isSubmitted ? '' : renderOptionList(q);

  // 状态条
  const statusHtml = renderStatusBar(q, isSubmitted);
  const submittedStatsHtml = isSubmitted ? `
    <div style="width:100%;margin-bottom:16px;">
      ${statusHtml}
    </div>` : '';

  // 操作按钮
  const actionHtml = renderActions(q, isSubmitted);

  const hintHtml = !isSubmitted ? `
  <div class="rounded-[14px] px-4 py-3" style="margin-bottom:16px;background:rgba(0,122,255,0.07);border:1px solid rgba(0,122,255,0.12);">
    <div class="flex items-start gap-2">
      <i data-lucide="scan-search" class="mt-0.5 h-4 w-4 shrink-0" style="color:#007aff;"></i>
      <p class="text-sm leading-relaxed" style="color:var(--muted-foreground);">先观察左侧设计图，再在右侧多选问题。提交前不会显示热点答案。</p>
    </div>
  </div>` : '';

  const rightColumnHtml = isSubmitted
    ? `<div class="flex h-full flex-col" style="align-self:stretch;margin-top:0;">${renderExplanationList(q)}${actionHtml}</div>`
    : `<div style="align-self:start;margin-top:0;">${optionsHtml}${statusHtml}${actionHtml}</div>`;

  const exerciseHtml = `
  <div class="grid grid-cols-1 ${isSubmitted ? 'items-stretch' : 'items-start'} gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] md:gap-6">
    <div class="md:sticky md:top-24" style="align-self:start;margin-top:0;">${imageHtml}</div>
    ${rightColumnHtml}
  </div>`;

  return headerHtml + progressHtml + questionHtml + hintHtml + submittedStatsHtml + exerciseHtml;
}

function getQuestionOptions(q) {
  if (optionsByQuestionId.has(q.id)) return optionsByQuestionId.get(q.id);

  const correct = q.hotspots.map((h) => ({
    id: `correct-${q.id}-${h.id}`,
    hotspotId: h.id,
    label: h.issue,
    isCorrect: true,
  }));
  const distractors = spotQuestions
    .filter((item) => item.id !== q.id)
    .flatMap((item) => item.hotspots.map((h) => ({
      id: `distractor-${item.id}-${h.id}`,
      hotspotId: null,
      label: h.issue,
      isCorrect: false,
    })))
    .filter((option, index, all) => all.findIndex((item) => item.label === option.label) === index);

  const seed = [...q.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const selectedDistractors = Array.from({ length: Math.min(3, distractors.length) }, (_, index) =>
    distractors[(seed + index * 7) % distractors.length]
  );
  const options = shuffleQuestions([...correct, ...selectedDistractors]);
  optionsByQuestionId.set(q.id, options);
  return options;
}

function renderOptionList(q) {
  const options = getQuestionOptions(q);
  return `
  <div role="group" aria-labelledby="spot-options-heading" class="rounded-[20px] border p-5 md:p-6" style="border-color:var(--border);background:var(--card);">
    <h3 id="spot-options-heading" style="font-size:18px;font-weight:700;color:var(--foreground);margin-bottom:8px;">请选择你发现的问题（可多选）</h3>
    <p class="text-xs" style="margin:4px 0 14px;color:var(--muted-foreground);">结合图片中的层级、对齐、重复和间距判断，不要只看题目标题。</p>
    <div class="grid grid-cols-1 gap-3">
      ${options.map((option, index) => {
        const selected = state.selectedOptionIds.includes(option.id);
        return `<button type="button" role="checkbox" aria-checked="${selected}" data-option-id="${escapeHtml(option.id)}"
          class="flex items-start gap-3 rounded-[14px] border p-4 text-left transition-all"
          style="border-color:${selected ? '#007aff' : 'var(--border)'};background:${selected ? 'rgba(0,122,255,0.08)' : 'var(--background)'};color:var(--foreground);">
          <span aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;flex:0 0 22px;border-radius:7px;border:1.5px solid ${selected ? '#007aff' : 'var(--border)'};background:${selected ? '#007aff' : 'transparent'};color:#fff;font-size:13px;font-weight:700;">${selected ? '✓' : ''}</span>
          <span style="font-size:14px;line-height:1.55;"><strong style="color:var(--muted-foreground);margin-right:6px;">${String.fromCharCode(65 + index)}.</strong>${escapeHtml(option.label)}</span>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

function renderImageWithHotspots(q, isSubmitted, foundIds) {
  return `
  <div class="relative rounded-[20px] overflow-hidden border" style="border-color:var(--border);background:var(--card);">
    <img src="${q.image}" alt="${escapeHtml(q.scenario)}页面设计图" class="block w-full h-auto select-none" draggable="false"
      onerror="this.replaceWith(Object.assign(document.createElement('div'), { className: 'p-10 text-center', textContent: '设计图加载失败，请刷新重试' }))" />
  </div>`;
}

function renderStatusBar(q, isSubmitted) {
  const foundCount = state.foundHotspotIds.length;
  const totalCount = q.hotspots.length;
  const wrongCount = state.wrongClickCount;

  if (isSubmitted) {
    const missedCount = totalCount - foundCount;
    return `
    <div class="grid grid-cols-3 gap-3" style="margin-top:0;align-items:stretch;">
      <div class="rounded-[14px] p-4 text-center" style="background:rgba(52,199,89,0.08);">
        <div style="font-size:24px;font-weight:700;color:#34c759;">${foundCount}</div>
        <div style="font-size:12px;color:var(--muted-foreground);margin-top:4px;">已发现</div>
      </div>
      <div class="rounded-[14px] p-4 text-center" style="background:rgba(255,59,48,0.08);">
        <div style="font-size:24px;font-weight:700;color:#ff3b30;">${missedCount}</div>
        <div style="font-size:12px;color:var(--muted-foreground);margin-top:4px;">遗漏</div>
      </div>
      <div class="rounded-[14px] p-4 text-center" style="background:rgba(255,149,0,0.08);">
        <div style="font-size:24px;font-weight:700;color:#ff9500;">${wrongCount}</div>
        <div style="font-size:12px;color:var(--muted-foreground);margin-top:4px;">误选项</div>
      </div>
    </div>`;
  }

  return `
  <div class="flex items-center justify-between rounded-[14px] px-5 py-3" style="margin-top:20px;background:var(--secondary);">
    <span class="text-sm" style="color:var(--foreground);">已选 <strong style="color:#007aff;">${state.selectedOptionIds.length}</strong> 项</span>
    <span class="text-sm" style="color:var(--muted-foreground);">误选 ${wrongCount} 项 · 正确问题 ${totalCount} 项</span>
  </div>`;
}

function renderActions(q, isSubmitted) {
  if (isSubmitted) {
    const isLast = state.questionIndex >= shuffledQuestions.length - 1;
    return `
    <div style="display:flex;flex-direction:column;flex:1;margin-top:auto;">
      <button type="button" data-action="next" class="w-full h-12 rounded-full transition-transform hover:scale-[1.01]" style="margin-top:auto;background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        ${isLast ? '查看训练结果' : '下一题'}
      </button>
    </div>`;
  }

  const canSubmit = state.selectedOptionIds.length > 0;
  return `
  <button type="button" data-action="submit" ${canSubmit ? '' : 'disabled'}
    class="w-full h-12 rounded-full transition-transform ${canSubmit ? 'hover:scale-[1.01]' : 'opacity-50 cursor-not-allowed'}"
    style="background:${canSubmit ? 'var(--foreground)' : 'var(--secondary)'};color:${canSubmit ? 'var(--background)' : 'var(--muted-foreground)'};font-size:15px;font-weight:600;margin-top:20px;">
    ${canSubmit ? '提交答案' : '至少选择一项后提交'}
  </button>`;
}

function renderExplanationList(q) {
  const foundIds = state.foundHotspotIds;
  return `
  <div class="rounded-[20px] border p-5 md:p-6" style="margin-bottom:16px;border-color:var(--border);background:var(--card);">
    <h3 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:18px;color:var(--foreground);margin-bottom:16px;">问题解析</h3>
    ${q.hotspots.map((h) => {
      const isFound = foundIds.includes(h.id);
      const statusColor = isFound ? '#34c759' : '#ff3b30';
      const statusLabel = isFound ? '已发现' : '遗漏';
      return `
      <div class="rounded-[14px] p-4" style="margin-bottom:12px;background:var(--secondary);">
        <div class="flex items-center gap-2" style="margin-bottom:8px;">
          <span class="rounded-full px-2 py-0.5 text-xs font-bold" style="background:${statusColor};color:#fff;">${statusLabel}</span>
          <span class="text-sm font-semibold" style="color:var(--foreground);">${escapeHtml(h.issue)}</span>
        </div>
        <div class="text-sm" style="color:var(--muted-foreground);margin-bottom:8px;">
          <strong style="color:var(--foreground);">设计原则：</strong>${escapeHtml(h.principle)}
        </div>
        <div class="text-sm" style="color:var(--muted-foreground);margin-bottom:8px;">
          <strong style="color:var(--foreground);">问题说明：</strong>${escapeHtml(h.explanation)}
        </div>
        <div class="text-sm" style="color:var(--muted-foreground);">
          <strong style="color:var(--foreground);">修改建议：</strong>${escapeHtml(h.suggestion)}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ============ 结果页渲染 ============ */

function renderResult() {
  const total = state.answers.length;
  const totalScore = state.answers.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
  const totalFound = state.answers.reduce((sum, a) => sum + a.foundHotspotIds.length, 0);
  const totalMissed = state.answers.reduce((sum, a) => sum + a.missedHotspotIds.length, 0);
  const totalWrong = state.answers.reduce((sum, a) => sum + a.wrongClickCount, 0);
  const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

  // 各维度得分
  const dimStats = {};
  for (const dim of Object.keys(SPOT_DIMENSIONS)) {
    dimStats[dim] = { total: 0, score: 0 };
  }
  for (const a of state.answers) {
    if (!dimStats[a.dimension]) continue;
    dimStats[a.dimension].total += 1;
    dimStats[a.dimension].score += Number(a.score) || 0;
  }

  // 最薄弱维度
  let weakest = null;
  let weakestAvg = Infinity;
  for (const [dim, s] of Object.entries(dimStats)) {
    if (s.total === 0) continue;
    const avg = s.score / s.total;
    if (avg < weakestAvg) {
      weakestAvg = avg;
      weakest = dim;
    }
  }

  const rating = avgScore >= 85 ? { label: '审美敏锐', color: '#af52de' }
    : avgScore >= 70 ? { label: '观察优秀', color: '#34c759' }
    : avgScore >= 50 ? { label: '继续提升', color: '#007aff' }
    : { label: '需要练习', color: '#ff9500' };

  return `
  <div class="flex items-center justify-between" style="margin-bottom:24px;">
    <a href="/training" data-link="/training" class="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">
      <i data-lucide="arrow-left" class="w-4 h-4"></i>
      <span>返回</span>
    </a>
    <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:20px;color:var(--foreground);letter-spacing:-0.02em;">训练结果</h1>
    <span class="text-sm" style="color:var(--muted-foreground);">共 ${total} 题</span>
  </div>

  <div class="rounded-[28px] border p-8 md:p-10 text-center" style="border-color:var(--border);background:var(--card);">
    <span class="inline-flex h-16 w-16 items-center justify-center rounded-full" style="background:${rating.color}1a;">
      <i data-lucide="search" class="w-7 h-7" style="color:${rating.color};"></i>
    </span>
    <h2 class="mt-5" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:28px;color:var(--foreground);letter-spacing:-0.02em;">${avgScore} 分</h2>
    <p class="mt-2 text-sm" style="color:${rating.color};font-weight:600;">${rating.label}</p>
  </div>

  <div class="grid grid-cols-2 gap-3 md:grid-cols-4" style="margin-top:16px;">
    <div class="rounded-[16px] p-4 text-center" style="background:var(--card);border:1px solid var(--border);">
      <div style="font-size:22px;font-weight:700;color:#34c759;">${totalFound}</div>
      <div style="font-size:12px;color:var(--muted-foreground);margin-top:4px;">正确发现</div>
    </div>
    <div class="rounded-[16px] p-4 text-center" style="background:var(--card);border:1px solid var(--border);">
      <div style="font-size:22px;font-weight:700;color:#ff3b30;">${totalMissed}</div>
      <div style="font-size:12px;color:var(--muted-foreground);margin-top:4px;">遗漏数量</div>
    </div>
    <div class="rounded-[16px] p-4 text-center" style="background:var(--card);border:1px solid var(--border);">
      <div style="font-size:22px;font-weight:700;color:#ff9500;">${totalWrong}</div>
      <div style="font-size:12px;color:var(--muted-foreground);margin-top:4px;">误选项</div>
    </div>
    <div class="rounded-[16px] p-4 text-center" style="background:var(--card);border:1px solid var(--border);">
      <div style="font-size:22px;font-weight:700;color:#007aff;">${totalScore}</div>
      <div style="font-size:12px;color:var(--muted-foreground);margin-top:4px;">总得分</div>
    </div>
  </div>

  ${renderDimensionResult(dimStats, weakest)}

  <div class="flex flex-col gap-3" style="margin-top:24px;">
    <button type="button" data-action="restart" class="w-full h-12 rounded-full transition-transform hover:scale-[1.01]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">再练一轮</button>
    <a href="/training" data-link="/training" class="w-full h-12 rounded-full inline-flex items-center justify-center transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:15px;font-weight:500;">返回训练首页</a>
  </div>`;
}

function renderDimensionResult(dimStats, weakest) {
  const dims = Object.entries(SPOT_DIMENSIONS);
  return `
  <div class="rounded-[20px] border p-5" style="margin-top:16px;border-color:var(--border);background:var(--card);">
    <h3 style="font-weight:700;font-size:15px;color:var(--foreground);margin-bottom:12px;">各维度表现</h3>
    ${dims.map(([key, label]) => {
      const s = dimStats[key] || { total: 0, score: 0 };
      const avg = s.total > 0 ? Math.round(s.score / s.total) : 0;
      const isWeakest = key === weakest;
      return `
      <div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--border);">
        <div class="flex items-center gap-2">
          <span class="text-sm" style="color:var(--foreground);font-weight:600;">${label}</span>
          ${isWeakest ? `<span class="rounded-full px-2 py-0.5 text-xs" style="background:rgba(255,149,0,0.12);color:#ff9500;">最薄弱</span>` : ''}
        </div>
        <span class="text-sm" style="color:var(--muted-foreground);">${s.total > 0 ? `${avg} 分 / ${s.total} 题` : '未练习'}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function renderError(message) {
  const safe = escapeHtml(message || '页面加载失败，请刷新后重试');
  return `
  <div class="text-center" style="padding:96px 0;">
    <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:rgba(255,59,48,0.12);">
      <span style="color:#ff3b30;font-size:28px;font-weight:700;">!</span>
    </span>
    <p style="margin-top:20px;color:var(--muted-foreground);font-size:14px;">${safe}</p>
    <a href="/training" data-link="/training" class="inline-flex items-center justify-center rounded-full text-sm font-semibold"
      style="margin-top:24px;height:44px;padding:0 24px;background:var(--foreground);color:var(--background);">返回训练首页</a>
  </div>`;
}

/* ============ 生命周期 ============ */

export function mountTrainingSpot() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;
  spotMounted = true;
  container.addEventListener('click', handleContainerClick);
  refreshIcons();
}

export function unmountTrainingSpot() {
  spotMounted = false;
  // 事件委托绑定在 container 上，container 随 innerHTML 替换后自动回收
}

/* ============ 事件处理 ============ */

function handleContainerClick(e) {
  if (!spotMounted) return;

  const optionEl = e.target.closest('[data-option-id]');
  if (optionEl && (state.status === 'question' || state.status === 'selecting')) {
    toggleOption(optionEl.dataset.optionId);
    return;
  }

  // 操作按钮
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  if (action === 'submit' && (state.status === 'question' || state.status === 'selecting')) {
    submitAnswer();
  } else if (action === 'next' && state.status === 'submitted') {
    nextQuestion();
  } else if (action === 'restart') {
    restart();
  }
}

function toggleOption(optionId) {
  if (!optionId) return;
  const index = state.selectedOptionIds.indexOf(optionId);
  if (index >= 0) state.selectedOptionIds.splice(index, 1);
  else state.selectedOptionIds.push(optionId);
  state.status = 'question';
  updateContainer();
}

/* ============ 状态流转 ============ */

function submitAnswer() {
  const q = shuffledQuestions[state.questionIndex];
  if (!q || !q.hotspots || q.hotspots.length === 0) return;

  const options = getQuestionOptions(q);
  if (state.selectedOptionIds.length === 0) return;
  const selected = options.filter((option) => state.selectedOptionIds.includes(option.id));
  const correctSelected = selected.filter((option) => option.isCorrect);
  const incorrectSelected = selected.filter((option) => !option.isCorrect);
  const missedHotspotIds = q.hotspots
    .filter((hotspot) => !correctSelected.some((option) => option.hotspotId === hotspot.id))
    .map((hotspot) => hotspot.id);
  const foundHotspotIds = correctSelected.map((option) => option.hotspotId);

  // 正确选项按召回率计分，误选项额外扣分，满分 100。
  const foundCount = foundHotspotIds.length;
  const totalCount = q.hotspots.length;
  const baseScore = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;
  const penalty = Math.min(baseScore, incorrectSelected.length * 15);
  const score = Math.max(0, baseScore - penalty);

  state.foundHotspotIds = foundHotspotIds;
  state.wrongClickCount = incorrectSelected.length;
  const answer = {
    questionId: q.id,
    dimension: q.dimension,
    foundHotspotIds: [...foundHotspotIds],
    missedHotspotIds,
    wrongClickCount: state.wrongClickCount,
    score,
    completedAt: Date.now(),
  };
  state.answers.push(answer);
  state.status = 'submitted';
  updateContainer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextQuestion() {
  if (state.status !== 'submitted') return;

  if (state.questionIndex >= shuffledQuestions.length - 1) {
    finishTraining();
    return;
  }

  state.questionIndex += 1;
  state.foundHotspotIds = [];
  state.selectedOptionIds = [];
  state.wrongClickCount = 0;
  state.status = 'question';
  updateContainer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function finishTraining() {
  state.status = 'finished';
  recordSpotSession({
    startedAt: state.startedAt,
    finishedAt: Date.now(),
    answers: state.answers,
  });
  updateContainer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restart() {
  try {
    shuffledQuestions = prepareSpotQuestions(spotQuestions, 8);
    state = createInitialState();
  } catch (e) {
    state = createInitialState();
    state.status = 'error';
    state.errorMessage = '题目加载失败，请刷新重试';
  }
  updateContainer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============ 抽题逻辑 ============ */

function prepareSpotQuestions(list, count = 8) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const recentIds = new Set(getRecentSpotQuestionIds(20));
  const fresh = list.filter((q) => !recentIds.has(q.id));
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

/* ============ 局部更新 ============ */

function updateContainer() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;
  container.innerHTML = renderContent();
  refreshIcons();
}

function refreshIcons() {
  try {
    if (window.lucide) window.lucide.createIcons();
  } catch (_) {
    // 图标渲染失败不影响功能
  }
}

/* ============ 工具函数 ============ */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
