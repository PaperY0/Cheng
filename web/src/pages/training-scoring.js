// 维度打分训练页 - 用户对页面设计图四维度评分，与 AI 参考评分对照
// 状态机：idle → scoring → submitting → result → (next | finished) | error
// 纯前端 + 后端 AI 评分接口（POST /api/training/score）

import { scoringQuestions, SCORING_DIMENSIONS } from '../training/scoringTrainingData.js';
import { shuffleQuestions } from '../training/trainingUtils.js';
import { recordScoringSession, getRecentScoringQuestionIds } from '../training/trainingStore.js';

const CONTAINER_ID = 'training-scoring-app';
const DIMENSION_KEYS = ['layout', 'color', 'typography', 'whitespace'];

// 模块级状态
let state = createInitialState();
let shuffledQuestions = [];
let scoringMounted = false;
let submitAbortController = null;

function createInitialState() {
  return {
    status: 'idle', // idle | scoring | submitting | result | finished | error
    questionIndex: 0,
    scores: { layout: 0, color: 0, typography: 0, whitespace: 0 }, // 0 表示未评分
    aiResult: null, // AI 返回的 { aiScores, overallComment, strengths, improvements, confidence, provider, fallback }
    answers: [], // [{ questionId, dimension, userScores, aiScores, scoreDifference, weakestDimension, completedAt }]
    startedAt: Date.now(),
    errorMessage: '',
  };
}

// 客户端 ID（用于服务端每日限额统计，匿名标识）
const CLIENT_ID_KEY = 'training-client-id';
function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch (_) {
    return 'anonymous';
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ============ 抽题逻辑 ============ */

function prepareScoringQuestions(list, count = 8) {
  const recentIds = getRecentScoringQuestionIds(20);
  const recentSet = new Set(recentIds);
  const fresh = list.filter((q) => !recentSet.has(q.id));
  const candidates = fresh.length >= count ? fresh : list;

  const selected = [];
  for (const q of shuffleQuestions(candidates)) {
    if (selected.length >= count) break;
    // 避免连续相同维度
    const prev = selected[selected.length - 1];
    if (prev && prev.dimension === q.dimension && candidates.some((item) => item.dimension !== prev.dimension && !selected.includes(item))) {
      continue;
    }
    selected.push(q);
  }
  // 补足
  if (selected.length < count) {
    for (const q of shuffleQuestions(candidates)) {
      if (selected.length >= count) break;
      if (!selected.includes(q)) selected.push(q);
    }
  }
  return selected;
}

/* ============ 渲染入口 ============ */

export function renderTrainingScoring() {
  try {
    shuffledQuestions = prepareScoringQuestions(scoringQuestions, 8);
    if (shuffledQuestions.length === 0) {
      state = createInitialState();
      state.status = 'error';
      state.errorMessage = '暂无可用题目';
    } else {
      state = createInitialState();
    }
  } catch (e) {
    console.error('[scoring-training] 题目加载失败', e);
    state = createInitialState();
    state.status = 'error';
    state.errorMessage = '题目加载失败，请刷新重试';
  }

  return `
  <section class="mx-auto max-w-[960px] px-6" style="padding-top:32px;padding-bottom:96px;">
    <div id="${CONTAINER_ID}">${renderContent()}</div>
    <p class="text-center text-xs" style="margin-top:20px;color:var(--muted-foreground);">
      为页面设计图的四个维度各打 1～10 分，与 AI 参考评分对照
    </p>
  </section>`;
}

function renderContent() {
  if (state.status === 'error') return renderError(state.errorMessage);
  if (state.status === 'finished') return renderResult();
  return renderQuestion();
}

function renderError(message) {
  return `<div class="rounded-[24px] border p-10 text-center" style="border-color:var(--border);background:var(--card);">
    <span class="inline-flex h-12 w-12 items-center justify-center rounded-full" style="background:rgba(255,59,48,0.12);">
      <span style="color:#ff3b30;font-size:24px;font-weight:700;">!</span>
    </span>
    <h2 style="margin-top:16px;font-weight:700;font-size:20px;color:var(--foreground);">${escapeHtml(message || '加载失败')}</h2>
    <a href="/training" data-link="/training" class="inline-flex h-11 items-center justify-center rounded-full px-6" style="margin-top:24px;border:1px solid var(--border);color:var(--foreground);font-size:14px;">返回训练首页</a>
  </div>`;
}

/* ============ 题目渲染 ============ */

function renderQuestion() {
  const q = shuffledQuestions[state.questionIndex];
  if (!q || !q.image) {
    return renderError('题目数据异常，请刷新重试');
  }

  const total = shuffledQuestions.length;
  const current = state.questionIndex + 1;
  const progressPct = (current / total) * 100;
  const isResult = state.status === 'result';
  const isSubmitting = state.status === 'submitting';

  // 顶部栏
  const headerHtml = `
  <div class="flex items-center justify-between" style="margin-bottom:24px;">
    <a href="/training" data-link="/training" class="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">
      <i data-lucide="arrow-left" class="w-4 h-4"></i>
      <span>返回</span>
    </a>
    <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:20px;color:var(--foreground);letter-spacing:-0.02em;">维度打分</h1>
    <span class="text-sm" style="color:var(--muted-foreground);">第 ${current} / ${total} 题</span>
  </div>`;

  // 进度条
  const progressHtml = `
  <div class="h-1.5 rounded-full overflow-hidden" style="margin-bottom:24px;background:var(--secondary);">
    <div class="h-full rounded-full" style="width:${progressPct}%;background:linear-gradient(90deg,#007aff,#5ac8fa);transition:width 0.3s ease;"></div>
  </div>`;

  // 题目信息
  const dimLabel = SCORING_DIMENSIONS[q.dimension] || q.dimension;
  const questionHtml = `
  <div class="rounded-full px-3 py-1 text-xs font-medium inline-block" style="margin-bottom:12px;background:rgba(0,122,255,0.1);color:#007aff;">${escapeHtml(dimLabel)} · ${escapeHtml(q.scenario)}</div>
  <h2 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:24px;color:var(--foreground);letter-spacing:-0.02em;margin-bottom:16px;">${escapeHtml(q.title)}</h2>`;

  // 图片
  const imageHtml = `
  <div class="rounded-[20px] border overflow-hidden" style="margin-bottom:24px;border-color:var(--border);background:var(--card);">
    <img src="${escapeHtml(q.image)}" alt="${escapeHtml(q.scenario)}设计图" class="w-full" style="display:block;" 
      onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\'p-10 text-center\' style=\'color:var(--muted-foreground);\'>图片加载失败</div>'" />
  </div>`;

  // 评分输入或结果
  const scoringHtml = isResult
    ? renderResultComparison(q)
    : renderScoringInputs(isSubmitting);

  // 提交中提示
  const submittingHint = isSubmitting ? `
  <div class="rounded-[16px] p-4 text-center" style="margin-top:16px;background:rgba(0,122,255,0.06);">
    <span class="inline-block h-5 w-5 rounded-full align-middle" style="border:2px solid var(--border);border-top-color:#007aff;animation:spin 0.8s linear infinite;"></span>
    <span class="text-sm align-middle" style="margin-left:8px;color:var(--foreground);">正在比较你的评分与 AI 的视觉判断……</span>
  </div>` : '';

  // 操作按钮
  const actionHtml = renderActions(isResult, isSubmitting);

  return headerHtml + progressHtml + questionHtml + imageHtml + scoringHtml + submittingHint + actionHtml;
}

/* ============ 评分输入 ============ */

function renderScoringInputs(isSubmitting) {
  const allScored = DIMENSION_KEYS.every((dim) => state.scores[dim] > 0);

  const cards = DIMENSION_KEYS.map((dim) => {
    const label = SCORING_DIMENSIONS[dim];
    const value = state.scores[dim];
    return `
    <div class="rounded-[19.2px] p-4" style="border:1px solid var(--border);background:var(--card);">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium" style="color:var(--foreground);">${escapeHtml(label)}</span>
        <span class="text-lg" style="font-family:'JetBrains Mono',monospace;color:var(--foreground);font-variant-numeric:tabular-nums;">${value > 0 ? value : '-'}</span>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" data-score-dim="${dim}" data-score-delta="-1" ${isSubmitting ? 'disabled' : ''}
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
          style="border:1px solid var(--border);background:var(--card);color:var(--foreground);${isSubmitting ? 'opacity:0.4;cursor:not-allowed;' : 'cursor:pointer;'}"
          aria-label="${escapeHtml(label)}减分">-</button>
        <input type="range" min="0" max="10" value="${value}" data-score-slider="${dim}"
          ${isSubmitting ? 'disabled' : ''}
          class="flex-1" style="accent-color:var(--primary);"
          aria-label="${escapeHtml(label)}评分滑块" />
        <button type="button" data-score-dim="${dim}" data-score-delta="1" ${isSubmitting ? 'disabled' : ''}
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
          style="border:1px solid var(--border);background:var(--card);color:var(--foreground);${isSubmitting ? 'opacity:0.4;cursor:not-allowed;' : 'cursor:pointer;'}"
          aria-label="${escapeHtml(label)}加分">+</button>
      </div>
    </div>`;
  }).join('');

  const hintHtml = `
  <p class="text-xs" style="margin-top:12px;color:var(--muted-foreground);">
    ${allScored ? '四个维度均已评分，可以提交' : '请为四个维度各打 1～10 分后提交'}
  </p>`;

  return `<div class="flex flex-col gap-3">${cards}</div>${hintHtml}`;
}

/* ============ 结果对照 ============ */

function renderResultComparison(q) {
  const ai = state.aiResult;
  if (!ai) return '';

  // 对照卡片列表
  const cards = DIMENSION_KEYS.map((dim) => {
    const label = SCORING_DIMENSIONS[dim];
    const userScore = state.scores[dim];
    const aiScore = ai.aiScores[dim];
    const diff = userScore - aiScore;
    const absDiff = Math.abs(diff);
    const isBiased = absDiff >= 2;

    const borderColor = isBiased ? 'border-left:3px solid var(--state-error);' : '';
    const badgeBg = isBiased ? 'var(--state-error)' : 'var(--state-success)';
    const badgeText = isBiased ? `偏差 ${absDiff}` : (absDiff === 0 ? '一致' : `偏差 ${absDiff}`);
    const direction = diff > 0 ? '偏高' : (diff < 0 ? '偏低' : '一致');

    return `
    <div class="rounded-[19.2px] p-4" style="background:var(--card);border:1px solid var(--border);${borderColor}">
      <div class="mb-2 flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-2 min-w-0">
          <span class="text-sm font-medium shrink-0" style="color:var(--foreground);">${escapeHtml(label)}</span>
          <span class="text-sm truncate" style="color:var(--muted-foreground);">你给 ${userScore} 分，AI 给 ${aiScore} 分</span>
        </div>
        <span class="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium shrink-0" style="background:${badgeBg};color:white;">${badgeText}</span>
      </div>
      <p class="text-xs" style="color:var(--muted-foreground);">${diff > 0 ? '你的评分比 AI 高' : (diff < 0 ? '你的评分比 AI 低' : '与 AI 评分一致')}</p>
    </div>`;
  }).join('');

  // 最薄弱维度（用户评分最低的维度）
  let weakestDim = DIMENSION_KEYS[0];
  let weakestScore = state.scores[DIMENSION_KEYS[0]];
  for (const dim of DIMENSION_KEYS) {
    if (state.scores[dim] < weakestScore) {
      weakestScore = state.scores[dim];
      weakestDim = dim;
    }
  }
  const weakestLabel = SCORING_DIMENSIONS[weakestDim];

  const summaryHtml = `
  <div class="mt-4 rounded-[19.2px] px-4 py-3" style="background:var(--secondary);">
    <p class="text-sm leading-relaxed" style="color:var(--muted-foreground);">当前最薄弱维度：<span style="color:var(--foreground);font-weight:600;">${escapeHtml(weakestLabel)}</span>（${weakestScore}分）</p>
  </div>`;

  // AI 总结
  const fallbackNote = ai.fallback
    ? `<div class="rounded-[12px] px-3 py-2 text-xs" style="margin-bottom:12px;background:rgba(255,149,0,0.1);color:#ff9500;">AI 暂不可用，以下为本地兜底参考</div>`
    : '';

  const aiCommentHtml = `
  <div class="rounded-[19.2px] p-5" style="margin-top:16px;border:1px solid var(--border);background:var(--card);">
    <div class="flex items-center gap-2" style="margin-bottom:12px;">
      <span class="rounded-full px-2 py-0.5 text-xs font-medium" style="background:rgba(0,122,255,0.1);color:#007aff;">AI 参考评分</span>
      ${ai.provider === 'qwen-vl' ? `<span class="text-xs" style="color:var(--muted-foreground);">置信度 ${Math.round((ai.confidence || 0) * 100)}%</span>` : ''}
    </div>
    ${fallbackNote}
    <p class="text-sm leading-relaxed" style="color:var(--foreground);margin-bottom:16px;">${escapeHtml(ai.overallComment || '')}</p>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <p class="text-xs font-semibold" style="margin-bottom:8px;color:#34c759;">做得好的地方</p>
        ${(ai.strengths || []).map((s) => `<p class="text-xs leading-relaxed" style="margin-bottom:4px;color:var(--muted-foreground);">· ${escapeHtml(s)}</p>`).join('')}
      </div>
      <div>
        <p class="text-xs font-semibold" style="margin-bottom:8px;color:#ff9500;">需要改进的地方</p>
        ${(ai.improvements || []).map((s) => `<p class="text-xs leading-relaxed" style="margin-bottom:4px;color:var(--muted-foreground);">· ${escapeHtml(s)}</p>`).join('')}
      </div>
    </div>
  </div>`;

  return `<div class="flex flex-col gap-3">${cards}</div>${summaryHtml}${aiCommentHtml}`;
}

/* ============ 操作按钮 ============ */

function renderActions(isResult, isSubmitting) {
  if (isResult) {
    const isLast = state.questionIndex >= shuffledQuestions.length - 1;
    return `
    <div class="flex justify-end" style="margin-top:24px;">
      <button type="button" data-action="${isLast ? 'finish' : 'next'}"
        class="inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-8 text-sm font-semibold transition-transform hover:scale-[1.02]"
        style="background:var(--foreground);color:var(--background);">
        ${isLast ? '查看训练结果' : '下一题'}
        <i data-lucide="${isLast ? 'check' : 'arrow-right'}" class="w-4 h-4"></i>
      </button>
    </div>`;
  }

  const allScored = DIMENSION_KEYS.every((dim) => state.scores[dim] > 0);
  return `
  <div class="flex justify-end" style="margin-top:24px;">
    <button type="button" data-action="submit" ${isSubmitting || !allScored ? 'disabled' : ''}
      class="inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-8 text-sm font-semibold transition-transform"
      style="${isSubmitting || !allScored ? 'background:var(--secondary);color:var(--muted-foreground);cursor:not-allowed;' : 'background:var(--foreground);color:var(--background);cursor:pointer;'}hover:scale-[1.02];">
      ${isSubmitting ? '<span class="inline-block h-4 w-4 rounded-full" style="border:2px solid var(--border);border-top-color:#007aff;animation:spin 0.8s linear infinite;"></span>正在比较...' : '提交评分'}
    </button>
  </div>`;
}

/* ============ 最终结果 ============ */

function renderResult() {
  const answers = state.answers;
  const total = answers.length;

  // 各维度平均分
  const dimStats = {};
  for (const dim of DIMENSION_KEYS) {
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
    dimStats[dim] = {
      label: SCORING_DIMENSIONS[dim],
      userAvg: total > 0 ? (userSum / total).toFixed(1) : '0',
      aiAvg: total > 0 ? (aiSum / total).toFixed(1) : '0',
      avgDiff: count > 0 ? (diffSum / count).toFixed(1) : '0',
    };
  }

  // 最容易高估/低估的维度
  let biasedDim = null;
  let biasedAbs = -1;
  for (const dim of DIMENSION_KEYS) {
    const abs = Math.abs(Number(dimStats[dim].avgDiff));
    if (abs > biasedAbs) {
      biasedAbs = abs;
      biasedDim = dim;
    }
  }
  const biasDir = Number(dimStats[biasedDim].avgDiff) > 0 ? '高估' : '低估';

  // 表格
  const tableRows = DIMENSION_KEYS.map((dim) => {
    const s = dimStats[dim];
    const diff = Number(s.avgDiff);
    const diffColor = Math.abs(diff) >= 2 ? '#ff3b30' : (Math.abs(diff) >= 1 ? '#ff9500' : '#34c759');
    const diffSign = diff > 0 ? '+' : '';
    return `
    <tr style="border-bottom:1px solid var(--border);">
      <td class="py-3 px-2 text-sm" style="color:var(--foreground);font-weight:500;">${escapeHtml(s.label)}</td>
      <td class="py-3 px-2 text-sm text-right" style="font-family:'JetBrains Mono',monospace;color:var(--foreground);font-variant-numeric:tabular-nums;">${s.userAvg}</td>
      <td class="py-3 px-2 text-sm text-right" style="font-family:'JetBrains Mono',monospace;color:var(--muted-foreground);font-variant-numeric:tabular-nums;">${s.aiAvg}</td>
      <td class="py-3 px-2 text-sm text-right" style="font-family:'JetBrains Mono',monospace;color:${diffColor};font-variant-numeric:tabular-nums;font-weight:600;">${diffSign}${s.avgDiff}</td>
    </tr>`;
  }).join('');

  return `
  <div class="flex items-center justify-between" style="margin-bottom:24px;">
    <a href="/training" data-link="/training" class="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">
      <i data-lucide="arrow-left" class="w-4 h-4"></i>
      <span>返回</span>
    </a>
    <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:20px;color:var(--foreground);letter-spacing:-0.02em;">训练结果</h1>
    <span class="text-sm" style="color:var(--muted-foreground);">共 ${total} 题</span>
  </div>

  <div class="rounded-[24px] border p-8" style="border-color:var(--border);background:var(--card);">
    <h2 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:22px;color:var(--foreground);margin-bottom:6px;">维度评分对照</h2>
    <p class="text-sm" style="color:var(--muted-foreground);margin-bottom:20px;">你的评分与 AI 参考评分的平均差异</p>

    <table class="w-full" style="border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:2px solid var(--border);">
          <th class="py-2 px-2 text-left text-xs font-semibold" style="color:var(--muted-foreground);">维度</th>
          <th class="py-2 px-2 text-right text-xs font-semibold" style="color:var(--muted-foreground);">我的评分</th>
          <th class="py-2 px-2 text-right text-xs font-semibold" style="color:var(--muted-foreground);">AI 参考评分</th>
          <th class="py-2 px-2 text-right text-xs font-semibold" style="color:var(--muted-foreground);">平均差值</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div class="rounded-[16px] p-4" style="margin-top:20px;background:var(--secondary);">
      <p class="text-sm leading-relaxed" style="color:var(--foreground);">
        你最容易<span style="color:${biasDir === '高估' ? '#ff3b30' : '#ff9500'};font-weight:600;">${biasDir}</span>的维度是
        <span style="color:var(--foreground);font-weight:600;">${escapeHtml(SCORING_DIMENSIONS[biasedDim])}</span>
        （平均差值 ${dimStats[biasedDim].avgDiff}）
      </p>
    </div>
  </div>

  <div class="flex gap-3" style="margin-top:24px;">
    <a href="/training" data-link="/training" class="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold" style="border:1px solid var(--border);color:var(--foreground);">返回训练首页</a>
    <button type="button" data-action="restart"
      class="inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-semibold transition-transform hover:scale-[1.02]"
      style="background:var(--foreground);color:var(--background);">
      <i data-lucide="refresh-cw" class="w-4 h-4"></i>
      再练一轮
    </button>
  </div>`;
}

/* ============ 交互处理 ============ */

function rerender() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;
  container.innerHTML = renderContent();
  try {
    if (window.lucide) window.lucide.createIcons();
  } catch (_) {}
}

function setScore(dim, value) {
  const clamped = Math.max(0, Math.min(10, Math.round(Number(value) || 0)));
  state.scores[dim] = clamped;
  // 评分后从 idle 进入 scoring
  if (state.status === 'idle') state.status = 'scoring';
  rerender();
}

/**
 * 视觉模型稳定支持 PNG/JPEG，不直接把练习题的 SVG data URL 发给模型。
 * 页面展示仍使用 SVG；提交评分前在浏览器内栅格化为 PNG data URL。
 */
function rasterizeImageDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/svg+xml')) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || 960;
        canvas.height = image.naturalHeight || 600;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('浏览器不支持 Canvas');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error('训练题图片无法转换为 PNG'));
    image.src = dataUrl;
  });
}

async function submitAnswer() {
  // 防止重复提交
  if (state.status === 'submitting') return;

  // 校验四项都已评分
  if (!DIMENSION_KEYS.every((dim) => state.scores[dim] > 0)) return;

  const q = shuffledQuestions[state.questionIndex];
  if (!q) return;

  state.status = 'submitting';
  rerender();

  // 取消上一次未完成的请求（防御性）
  if (submitAbortController) {
    submitAbortController.abort();
  }
  submitAbortController = new AbortController();

  try {
    const modelImageUrl = await rasterizeImageDataUrl(q.image);
    const res = await fetch('/api/training/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: q.id,
        dimension: q.dimension,
        scores: state.scores,
        image: { url: modelImageUrl },
        clientId: getClientId(),
      }),
      signal: submitAbortController.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    state.aiResult = data;
    state.status = 'result';
    rerender();
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('[scoring-training] AI 评分请求失败', err);
    // 本地兜底：不阻塞训练
    state.aiResult = {
      aiScores: { layout: 6, color: 6, typography: 6, whitespace: 6 },
      overallComment: 'AI 评分请求失败，以下为本地兜底参考，请以你自己的判断为准。',
      strengths: ['请自行观察设计亮点'],
      improvements: ['请自行观察可改进之处'],
      confidence: 0,
      provider: 'local',
      fallback: true,
      fallbackReason: 'network_error',
    };
    state.status = 'result';
    rerender();
  } finally {
    submitAbortController = null;
  }
}

function recordCurrentAnswer() {
  const q = shuffledQuestions[state.questionIndex];
  if (!q || !state.aiResult) return;

  const userScores = { ...state.scores };
  const aiScores = { ...state.aiResult.aiScores };

  // 计算各维度差值与最薄弱维度
  let weakestDim = DIMENSION_KEYS[0];
  let weakestScore = userScores[DIMENSION_KEYS[0]];
  for (const dim of DIMENSION_KEYS) {
    if (userScores[dim] < weakestScore) {
      weakestScore = userScores[dim];
      weakestDim = dim;
    }
  }

  const totalDiff = DIMENSION_KEYS.reduce((sum, dim) => sum + Math.abs(userScores[dim] - aiScores[dim]), 0);

  state.answers.push({
    questionId: q.id,
    dimension: q.dimension,
    userScores,
    aiScores,
    scoreDifference: totalDiff,
    weakestDimension: weakestDim,
    completedAt: Date.now(),
  });
}

function nextQuestion() {
  recordCurrentAnswer();
  state.aiResult = null;

  if (state.questionIndex >= shuffledQuestions.length - 1) {
    // 完成
    state.status = 'finished';
    try {
      recordScoringSession({
        startedAt: state.startedAt,
        finishedAt: Date.now(),
        answers: state.answers,
      });
    } catch (e) {
      console.warn('[scoring-training] 保存训练记录失败', e);
    }
  } else {
    state.questionIndex += 1;
    state.scores = { layout: 0, color: 0, typography: 0, whitespace: 0 };
    state.status = 'idle';
  }
  rerender();
}

function restart() {
  state = createInitialState();
  shuffledQuestions = prepareScoringQuestions(scoringQuestions, 8);
  rerender();
}

/* ============ 事件绑定 ============ */

function handleContainerClick(e) {
  const target = e.target.closest('[data-action], [data-score-dim]');
  if (!target) return;

  if (target.dataset.scoreDim) {
    const dim = target.dataset.scoreDim;
    const delta = Number(target.dataset.scoreDelta);
    const current = state.scores[dim] || 0;
    // 0 表示未评分，加减时从中间值开始
    const base = current > 0 ? current : 5;
    setScore(dim, base + delta);
    return;
  }

  if (target.dataset.action) {
    const action = target.dataset.action;
    if (action === 'submit') {
      submitAnswer();
    } else if (action === 'next' || action === 'finish') {
      nextQuestion();
    } else if (action === 'restart') {
      restart();
    }
  }
}

function handleSliderInput(e) {
  const slider = e.target.closest('[data-score-slider]');
  if (!slider) return;
  const dim = slider.dataset.scoreSlider;
  setScore(dim, Number(slider.value));
}

function handleKeydown(e) {
  // 滑块键盘方向键已由原生 input[type=range] 支持
  // 加减按钮支持 Enter/Space
  const target = e.target.closest('[data-score-dim]');
  if (!target) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const dim = target.dataset.scoreDim;
    const delta = Number(target.dataset.scoreDelta);
    const current = state.scores[dim] || 0;
    const base = current > 0 ? current : 5;
    setScore(dim, base + delta);
  }
}

export function mountTrainingScoring() {
  if (scoringMounted) return;
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;

  container.addEventListener('click', handleContainerClick);
  container.addEventListener('input', handleSliderInput);
  container.addEventListener('keydown', handleKeydown);

  scoringMounted = true;
}

export function unmountTrainingScoring() {
  if (!scoringMounted) return;
  const container = document.getElementById(CONTAINER_ID);
  if (container) {
    container.removeEventListener('click', handleContainerClick);
    container.removeEventListener('input', handleSliderInput);
    container.removeEventListener('keydown', handleKeydown);
  }
  // 取消进行中的请求
  if (submitAbortController) {
    submitAbortController.abort();
    submitAbortController = null;
  }
  scoringMounted = false;
}
