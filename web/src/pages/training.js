// 审美训练页 - 好坏对比模式
// 纯前端实现：不调用任何后端 API 或 AI 服务
// 状态机：question → selected → submitted → (next | finished)

import { questions, getQuestionById, TRAINING_DIMENSIONS, TRAINING_DIFFICULTIES } from '../training/trainingData.js';
import { shuffleQuestions, calculateScore, getRating, formatDuration } from '../training/trainingUtils.js';
import { recordAnswer, recordSession, getWrongQuestionIds, getRecentQuestionIds } from '../training/trainingStore.js';
import { getTrainingFixtureImage } from '../training/trainingFixtures.js';

const CONTAINER_ID = 'training-app';

// 训练模式：full 全部题目 / wrong-only 只练错题
let trainingMode = 'full';
// 模块级状态：每次进入训练页时重置
let state = createInitialState();
let shuffledQuestions = [];
let trainingCompareMounted = false;

// AI 解析状态管理：按 questionId 存储
// 状态：idle（未请求）/ loading（请求中）/ success（AI 成功）/ local（降级本地）
const aiExplainStates = new Map();

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

function createInitialState() {
  return {
    status: 'question', // question | selected | submitted | finished
    questionIndex: 0,
    selectedOption: null,
    answers: [], // [{ questionId, dimension, userAnswer, correctAnswer, isCorrect }]
    startedAt: Date.now(),
  };
}

/**
 * 渲染训练首页（三卡片入口）
 * /training 路由进入时调用
 * - 好坏对比：可点击，进入 /training/compare
 * - 找茬训练：即将上线
 * - 维度打分：即将上线
 */
export function renderTraining() {
  return `
  <section class="mx-auto max-w-[800px] px-6" style="padding-top:96px;padding-bottom:96px;">
    <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
      <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:var(--secondary);">
        <i data-lucide="dumbbell" class="w-7 h-7" style="color:var(--foreground);"></i>
      </span>
      <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:32px;color:var(--foreground);letter-spacing:-0.02em;">审美训练</h1>
      <p class="mt-3 text-sm" style="color:var(--muted-foreground);">通过好坏对比、找茬、维度打分，系统化训练你的审美判断力。</p>
      <div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <a href="/training/compare" data-link="/training/compare" class="rounded-[20px] border-2 p-6 text-left transition-transform hover:scale-[1.02]" style="border-color:var(--foreground);background:var(--card);">
          <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--foreground);color:var(--background);">可使用</span>
          <h3 class="mt-3" style="font-weight:600;color:var(--foreground);">好坏对比</h3>
          <p class="mt-1 text-xs" style="color:var(--muted-foreground);">同主题双图选择</p>
        </a>
        <a href="/training/spot" data-link="/training/spot" class="rounded-[20px] border-2 p-6 text-left transition-transform hover:scale-[1.02]" style="border-color:var(--foreground);background:var(--card);">
          <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--foreground);color:var(--background);">可使用</span>
          <h3 class="mt-3" style="font-weight:600;color:var(--foreground);">找茬训练</h3>
          <p class="mt-1 text-xs" style="color:var(--muted-foreground);">识别设计缺陷</p>
        </a>
        <a href="/training/scoring" data-link="/training/scoring" class="rounded-[20px] border-2 p-6 text-left transition-transform hover:scale-[1.02]" style="border-color:var(--foreground);background:var(--card);">
          <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--foreground);color:var(--background);">可使用</span>
          <h3 class="mt-3" style="font-weight:600;color:var(--foreground);">维度打分</h3>
          <p class="mt-1 text-xs" style="color:var(--muted-foreground);">校准审美标尺</p>
        </a>
      </div>
      <a href="/" data-link="/" class="mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:15px;font-weight:500;">
        返回首页
      </a>
    </div>
  </section>`;
}

/**
 * 渲染好坏对比训练流程
 * /training/compare 路由进入时调用，重置状态并打乱题目
 */
export function renderTrainingCompare() {
  trainingMode = 'full';
  shuffledQuestions = prepareQuestions(questions, 8);
  state = createInitialState();

  return `
  <section class="mx-auto max-w-[960px] px-6" style="padding-top:32px;padding-bottom:96px;">
    <div id="${CONTAINER_ID}">${renderContent()}</div>
    <p class="text-center text-xs" style="margin-top:20px;color:var(--muted-foreground);">
      训练图片为程序生成的 UI 设计对比样本
    </p>
  </section>`;
}

/* ============ 内容渲染 ============ */

function renderContent() {
  if (state.status === 'finished') return renderResult();
  if (state.status === 'evaluating') return renderEvaluating();
  return renderQuestion();
}

function renderEvaluating() {
  return `<div class="rounded-[24px] border p-10 text-center" style="margin-top:80px;border-color:var(--border);background:var(--card);">
    <span class="inline-block h-10 w-10 rounded-full" style="border:3px solid var(--border);border-top-color:#007aff;animation:spin 0.8s linear infinite;"></span>
    <h2 style="margin-top:20px;font-weight:700;font-size:22px;color:var(--foreground);">AI 正在比较 A/B 设计图</h2>
    <p style="margin-top:8px;color:var(--muted-foreground);font-size:14px;">本题答案将以 AI 的视觉判断为准</p>
  </div>`;
}

function renderQuestion() {
  const q = shuffledQuestions[state.questionIndex];
  if (!q) return renderError('题目加载失败，请刷新重试');

  const total = shuffledQuestions.length;
  const current = state.questionIndex + 1;
  const progressPct = (current / total) * 100;
  const isSubmitted = state.status === 'submitted';
  const userAnswer = state.selectedOption;

  // 顶部栏
  const headerHtml = `
  <div class="flex items-center justify-between" style="margin-bottom:24px;">
    <a href="/" data-link="/" class="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">
      <i data-lucide="arrow-left" class="w-4 h-4"></i>
      <span>返回</span>
    </a>
    <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:20px;color:var(--foreground);letter-spacing:-0.02em;">审美训练</h1>
    <span class="text-sm" style="color:var(--muted-foreground);">第 ${current} / ${total} 题</span>
  </div>`;

  // 进度条
  const progressHtml = `
  <div class="h-1.5 rounded-full overflow-hidden" style="margin-bottom:32px;background:var(--secondary);">
    <div class="h-full rounded-full" style="width:${progressPct}%;background:linear-gradient(90deg,#007aff,#5ac8fa);transition:width 0.3s ease;"></div>
  </div>`;

  // 模式标识（错题重练时显示）
  const modeBadge = trainingMode === 'wrong-only'
    ? `<div class="rounded-full px-3 py-1 text-xs font-medium" style="margin-bottom:16px;background:rgba(255,149,0,0.1);color:#ff9500;">错题重练模式</div>`
    : '';

  // 题目
  const questionHtml = `
  ${modeBadge}
  <h2 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:26px;color:var(--foreground);letter-spacing:-0.02em;margin-bottom:8px;">${escapeHtml(q.title)}</h2>
  <p class="text-sm" style="color:var(--muted-foreground);margin-bottom:24px;">${escapeHtml(q.question)}</p>`;

  // 图片卡片
  const cardsHtml = `
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    ${q.options.map((opt) => renderCard(opt, q, isSubmitted, userAnswer)).join('')}
  </div>`;

  // 解析（仅提交后显示）
  const explanationHtml = isSubmitted ? renderExplanation(q, userAnswer) : '';

  // 操作按钮
  const actionHtml = renderActionButton(state.status, state.questionIndex, shuffledQuestions.length);

  // 底部信息
  const footerHtml = `
  <div class="flex items-center justify-center gap-2" style="margin-top:24px;">
    <span class="rounded-full px-3 py-1 text-xs font-medium" style="background:var(--secondary);color:var(--foreground);">${escapeHtml(q.principle)}</span>
    <span class="rounded-full px-3 py-1 text-xs font-medium" style="background:var(--secondary);color:var(--foreground);">${escapeHtml(TRAINING_DIFFICULTIES[q.difficulty] || q.difficulty)}</span>
  </div>`;

  return headerHtml + progressHtml + questionHtml + cardsHtml + explanationHtml + actionHtml + footerHtml;
}

function renderCard(opt, q, isSubmitted, userAnswer) {
  const isSelected = userAnswer === opt.id;
  const isAnswer = q.answer === opt.id;

  // 边框与背景色
  let borderColor = 'var(--border)';
  let bgColor = 'rgba(255,255,255,0.6)';
  let extraStyle = 'cursor:pointer;';

  if (isSubmitted) {
    if (isAnswer) {
      borderColor = '#34c759';
      bgColor = 'rgba(52,199,89,0.08)';
    } else if (isSelected) {
      borderColor = '#ff3b30';
      bgColor = 'rgba(255,59,48,0.08)';
    }
    extraStyle = 'pointer-events:none;cursor:default;';
  } else if (isSelected) {
    borderColor = '#007aff';
    bgColor = 'rgba(0,122,255,0.06)';
  }

  // 状态角标
  let badgeHtml = '';
  if (isSubmitted && isAnswer) {
    badgeHtml = `<span class="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style="background:#34c759;color:#fff;box-shadow:0 2px 8px rgba(52,199,89,0.3);">✓</span>`;
  } else if (isSubmitted && isSelected && !isAnswer) {
    badgeHtml = `<span class="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style="background:#ff3b30;color:#fff;box-shadow:0 2px 8px rgba(255,59,48,0.3);">✗</span>`;
  }

  // A/B 标签
  const labelBg = isSelected ? '#007aff' : 'rgba(255,255,255,0.9)';
  const labelColor = isSelected ? '#fff' : 'var(--foreground)';

  const image = getTrainingFixtureImage(q.id, opt.id);

  return `
  <button type="button" data-option="${opt.id}" ${isSubmitted ? 'disabled' : ''}
    class="relative flex flex-col overflow-hidden rounded-[24px] border-2 transition-all duration-200 w-full text-left"
    style="padding:0;border-color:${borderColor};background:${bgColor};backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 4px 24px rgba(0,0,0,0.04);${extraStyle}${!isSubmitted ? 'hover:scale-[1.01];hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]' : ''}"
    aria-label="选择 ${escapeHtml(opt.label)}"
    aria-pressed="${isSelected}">
    <div class="relative flex items-center justify-center" style="aspect-ratio:4/3;min-height:180px;background:var(--secondary);">
      <img src="${escapeHtml(image)}" alt="选项 ${escapeHtml(opt.label)}" class="w-full h-full" style="object-fit:contain;display:block;"
        onerror="this.style.display='none';var f=this.parentElement.querySelector('.img-fallback');if(f)f.style.display='flex';" />
      <div class="img-fallback absolute inset-0 items-center justify-center text-xs" style="color:var(--muted-foreground);display:none;">
        图片待补充
      </div>
      <span class="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
        style="background:${labelBg};color:${labelColor};backdrop-filter:blur(8px);box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        ${escapeHtml(opt.label)}
      </span>
      ${badgeHtml}
    </div>
  </button>`;
}

function renderExplanation(q, userAnswer) {
  const answerRecord = state.answers.find((answer) => answer.questionId === q.id);
  const judgedAnswer = answerRecord?.correctAnswer || q.answer;
  const isCorrect = userAnswer === judgedAnswer;
  const correctOption = q.options.find((o) => o.id === judgedAnswer);
  const referenceHtml = answerRecord?.aiJudged
    ? `<p class="text-sm" style="color:var(--muted-foreground);margin-bottom:12px;">本题采用 AI 对 A/B 设计图的独立视觉判断，下面的设计原则仅作为学习参考。</p>`
    : `<p class="text-sm" style="color:var(--foreground);margin-bottom:12px;">${escapeHtml(q.explanation.correct)}</p>
       <p class="text-sm" style="color:var(--muted-foreground);margin-bottom:12px;">${escapeHtml(q.explanation.wrong)}</p>`;
  const accentColor = isCorrect ? '#34c759' : '#ff3b30';
  const accentBg = isCorrect ? 'rgba(52,199,89,0.04)' : 'rgba(255,59,48,0.04)';

  return `
  <div class="rounded-[20px] border p-6" style="margin-top:24px;border-color:${accentColor};background:${accentBg};">
    <div class="flex items-center gap-3">
      <span class="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold" style="background:${accentColor};color:#fff;">
        ${isCorrect ? '✓' : '✗'}
      </span>
      <div>
        <div style="font-weight:600;font-size:15px;color:var(--foreground);">${isCorrect ? '回答正确' : '回答错误'}</div>
        <div class="text-xs" style="color:var(--muted-foreground);">${answerRecord?.aiJudged ? 'AI 判断答案是' : '兜底答案是'} ${escapeHtml(correctOption ? correctOption.label : judgedAnswer)}</div>
      </div>
    </div>
    <div style="margin-top:16px;">
      ${referenceHtml}
      <div class="rounded-[12px] p-4" style="background:var(--secondary);">
        <p class="text-xs font-semibold" style="color:var(--foreground);margin-bottom:4px;">设计原则</p>
        <p class="text-sm" style="color:var(--foreground);">${escapeHtml(q.explanation.rule)}</p>
      </div>
    </div>
    ${renderAiExplainSection(q, userAnswer)}
  </div>`;
}

/**
 * 渲染 AI 解析区域
 * 状态：idle（按钮）/ loading（加载中）/ success（AI 成功）/ local（本地降级）
 */
function renderAiExplainSection(q, userAnswer) {
  const aiState = aiExplainStates.get(q.id) || { status: 'idle' };

  if (aiState.status === 'idle') {
    return `
    <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">
      <button type="button" data-action="ai-explain" data-question-id="${escapeHtml(q.id)}"
        class="w-full rounded-full text-sm font-medium transition-all hover:scale-[1.01]"
        style="height:40px;border:1px solid var(--border);background:transparent;color:var(--foreground);">
        查看 AI 深度解析
      </button>
    </div>`;
  }

  if (aiState.status === 'loading') {
    return `
    <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">
      <div class="flex items-center justify-center gap-2" style="height:40px;">
        <span class="inline-block h-4 w-4 rounded-full" style="border:2px solid var(--border);border-top-color:#007aff;animation:spin 0.8s linear infinite;"></span>
        <span class="text-sm" style="color:var(--muted-foreground);">AI 解析中…</span>
      </div>
    </div>`;
  }

  // success 或 local：显示解析内容
  const explanation = aiState.explanation;
  const isAiSuccess = aiState.status === 'success';
  const badgeBg = isAiSuccess ? 'rgba(0,122,255,0.1)' : 'var(--secondary)';
  const badgeColor = isAiSuccess ? '#007aff' : 'var(--muted-foreground)';
  const badgeText = isAiSuccess ? 'AI 解析' : '使用本地解析';
  const reasonText = aiState.reason ? getFallbackReasonText(aiState.reason) : '';
  const independentJudgement = isAiSuccess && aiState.explanation?.bestOption
    ? `<div class="rounded-[12px] p-3" style="margin-bottom:12px;background:rgba(0,122,255,0.08);">
        <p class="text-xs font-semibold" style="color:#007aff;margin-bottom:4px;">AI 独立判断</p>
        <p class="text-sm" style="color:var(--foreground);">AI 认为更符合本题原则的是 ${escapeHtml(String(aiState.explanation.bestOption).toUpperCase())} 选项（置信度 ${Math.round(Number(aiState.explanation.confidence || 0) * 100)}%）。</p>
      </div>`
    : '';

  return `
  <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">
    <div class="flex items-center gap-2" style="margin-bottom:12px;">
      <span class="rounded-full px-2.5 py-1 text-xs font-medium" style="background:${badgeBg};color:${badgeColor};">${badgeText}</span>
      ${reasonText ? `<span class="text-xs" style="color:var(--muted-foreground);">${escapeHtml(reasonText)}</span>` : ''}
    </div>
    ${independentJudgement}
    <div class="space-y-3">
      <div>
        <p class="text-xs font-semibold" style="color:var(--muted-foreground);margin-bottom:4px;">观察</p>
        <p class="text-sm" style="color:var(--foreground);">${escapeHtml(explanation.observation)}</p>
      </div>
      <div>
        <p class="text-xs font-semibold" style="color:var(--muted-foreground);margin-bottom:4px;">原则</p>
        <p class="text-sm" style="color:var(--foreground);">${escapeHtml(explanation.principle)}</p>
      </div>
      <div>
        <p class="text-xs font-semibold" style="color:var(--muted-foreground);margin-bottom:4px;">建议</p>
        <p class="text-sm" style="color:var(--foreground);">${escapeHtml(explanation.suggestion)}</p>
      </div>
      <div class="rounded-[12px] p-3" style="background:var(--secondary);">
        <p class="text-xs font-semibold" style="color:var(--foreground);margin-bottom:4px;">记忆口诀</p>
        <p class="text-sm" style="color:var(--foreground);">${escapeHtml(explanation.memoryTip)}</p>
      </div>
    </div>
  </div>`;
}

function getFallbackReasonText(reason) {
  const map = {
    disabled: 'AI 未开启',
    no_api_key: 'API Key 缺失',
    duplicate: '本题已请求过',
    daily_limit_exceeded: '今日 AI 额度已用完',
    timeout: 'AI 请求超时',
    provider_error: 'AI 服务异常',
    output_invalid: 'AI 返回格式异常',
    network_error: '网络错误',
    not_implemented: '该 provider 暂未实现',
    config_error: 'AI 配置错误',
  };
  return map[reason] || '';
}

function renderActionButton(status, questionIndex, total) {
  if (status === 'submitted') {
    const isLast = questionIndex >= total - 1;
    return `
    <button type="button" data-action="next"
      class="w-full rounded-full text-sm font-semibold transition-all hover:scale-[1.01]"
      style="margin-top:24px;height:48px;background:var(--foreground);color:var(--background);">
      ${isLast ? '查看训练结果' : '下一题'}
    </button>`;
  }

  // question | selected
  const disabled = status === 'question';
  const bgColor = disabled ? 'var(--secondary)' : 'var(--foreground)';
  const textColor = disabled ? 'var(--muted-foreground)' : 'var(--background)';
  const cursor = disabled ? 'not-allowed' : 'pointer';

  return `
  <button type="button" data-action="submit" ${disabled ? 'disabled' : ''}
    class="w-full rounded-full text-sm font-semibold transition-all"
    style="margin-top:24px;height:48px;background:${bgColor};color:${textColor};cursor:${cursor};${!disabled ? 'hover:scale-[1.01];' : ''}">
    提交答案
  </button>`;
}

/* ============ 结果页 ============ */

function renderResult() {
  const total = shuffledQuestions.length;
  const correctCount = state.answers.filter((a) => a.isCorrect).length;
  const wrongAnswers = state.answers.filter((a) => !a.isCorrect);
  const accuracy = total > 0 ? Math.round((correctCount / total) * 1000) / 10 : 0;
  const rating = getRating(correctCount / total);
  const duration = formatDuration(Math.round((Date.now() - state.startedAt) / 1000));

  // 计算各维度统计与最薄弱维度
  const dimensionStats = computeDimensionStats(state.answers);
  const weakest = findWeakestDimension(dimensionStats);

  return `
  <div style="padding-top:32px;padding-bottom:48px;">
    ${renderResultHeader(accuracy, rating, duration, correctCount, total)}
    ${renderScoreCards(correctCount, total, accuracy)}
    ${renderDimensionStats(dimensionStats, weakest)}
    ${renderWrongList(wrongAnswers)}
    ${renderResultActions(wrongAnswers.length)}
  </div>`;
}

function renderResultHeader(accuracy, rating, duration, correctCount, total) {
  return `
  <div class="text-center">
    <div class="flex items-center justify-between" style="margin-bottom:24px;">
      <a href="/training" data-link="/training" class="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">
        <i data-lucide="arrow-left" class="w-4 h-4"></i>
        <span>返回</span>
      </a>
      <h1 style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:20px;color:var(--foreground);letter-spacing:-0.02em;">训练结果</h1>
      <span class="text-sm" style="color:var(--muted-foreground);">${escapeHtml(duration)}</span>
    </div>
    <span class="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
      style="background:${rating.color}1a;color:${rating.color};font-size:32px;font-weight:700;">
      ${rating.level}
    </span>
    <h2 style="margin-top:16px;font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:32px;color:var(--foreground);letter-spacing:-0.02em;">${escapeHtml(rating.label)}</h2>
    <p class="text-sm" style="margin-top:8px;color:var(--muted-foreground);">${correctCount} / ${total} 题答对，正确率 ${accuracy}%</p>
  </div>`;
}

function renderScoreCards(correctCount, total, accuracy) {
  const wrongCount = total - correctCount;
  return `
  <div class="mx-auto grid grid-cols-3 gap-3" style="margin-top:32px;max-width:480px;">
    <div class="rounded-[20px] border p-4 text-center" style="border-color:var(--border);background:var(--card);">
      <div style="font-size:28px;font-weight:700;color:#34c759;">${correctCount}</div>
      <div class="text-xs" style="margin-top:4px;color:var(--muted-foreground);">答对</div>
    </div>
    <div class="rounded-[20px] border p-4 text-center" style="border-color:var(--border);background:var(--card);">
      <div style="font-size:28px;font-weight:700;color:#ff3b30;">${wrongCount}</div>
      <div class="text-xs" style="margin-top:4px;color:var(--muted-foreground);">答错</div>
    </div>
    <div class="rounded-[20px] border p-4 text-center" style="border-color:var(--border);background:var(--card);">
      <div style="font-size:28px;font-weight:700;color:var(--foreground);">${accuracy}%</div>
      <div class="text-xs" style="margin-top:4px;color:var(--muted-foreground);">正确率</div>
    </div>
  </div>`;
}

function renderDimensionStats(dimensionStats, weakest) {
  const dimensions = ['contrast', 'alignment', 'repetition', 'proximity'];
  return `
  <div class="mx-auto" style="margin-top:32px;max-width:480px;">
    <p class="text-xs font-semibold" style="color:var(--muted-foreground);margin-bottom:12px;">各设计原则正确率</p>
    ${dimensions.map((dim) => {
      const s = dimensionStats[dim];
      const dimScore = calculateScore(s.correct, s.total);
      const isWeakest = weakest && weakest.dimension === dim;
      return `
      <div class="flex items-center gap-3 rounded-[12px] p-3" style="background:var(--card);border:1px solid ${isWeakest ? '#ff9500' : 'var(--border)'};margin-bottom:8px;">
        <span class="text-sm font-medium" style="color:var(--foreground);min-width:50px;text-align:left;">${escapeHtml(TRAINING_DIMENSIONS[dim] || dim)}</span>
        <div class="flex-1 h-2 rounded-full overflow-hidden" style="background:var(--secondary);">
          <div class="h-full rounded-full" style="width:${dimScore}%;background:linear-gradient(90deg,#007aff,#5ac8fa);transition:width 0.4s ease;"></div>
        </div>
        <span class="text-xs" style="color:var(--muted-foreground);min-width:50px;text-align:right;">${s.correct}/${s.total} · ${dimScore}%</span>
        ${isWeakest ? `<span class="rounded-full px-2 py-0.5 text-xs" style="background:rgba(255,149,0,0.1);color:#ff9500;">薄弱</span>` : ''}
      </div>`;
    }).join('')}
    ${weakest ? `<p class="text-xs" style="margin-top:8px;color:#ff9500;text-align:center;">最薄弱维度：${escapeHtml(TRAINING_DIMENSIONS[weakest.dimension] || weakest.dimension)}（${weakest.accuracy}%）</p>` : ''}
  </div>`;
}

function renderWrongList(wrongAnswers) {
  if (wrongAnswers.length === 0) {
    return `
    <div class="mx-auto rounded-[20px] border p-8 text-center" style="margin-top:32px;max-width:480px;border-color:#34c759;background:rgba(52,199,89,0.04);">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style="background:#34c759;color:#fff;font-size:20px;">✓</span>
      <p style="margin-top:12px;font-weight:600;color:var(--foreground);">本轮全部答对</p>
      <p class="text-xs" style="margin-top:4px;color:var(--muted-foreground);">没有错题，表现非常棒</p>
    </div>`;
  }

  return `
  <div class="mx-auto" style="margin-top:32px;max-width:480px;">
    <p class="text-xs font-semibold" style="color:var(--muted-foreground);margin-bottom:12px;">错题回顾（${wrongAnswers.length} 题）</p>
    ${wrongAnswers.map((a, idx) => renderWrongItem(a, idx)).join('')}
  </div>`;
}

function renderWrongItem(answer, idx) {
  const q = getQuestionById(answer.questionId);
  if (!q) return '';

  const userOption = q.options.find((o) => o.id === answer.userAnswer);
  const correctOption = q.options.find((o) => o.id === answer.correctAnswer);

  return `
  <div class="rounded-[16px] border p-4" style="margin-bottom:12px;border-color:var(--border);background:var(--card);">
    <div class="flex items-center gap-2" style="margin-bottom:8px;">
      <span class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style="background:#ff3b30;color:#fff;">${idx + 1}</span>
      <span class="text-sm font-medium" style="color:var(--foreground);">${escapeHtml(q.title)}</span>
    </div>
    <p class="text-xs" style="color:var(--muted-foreground);margin-bottom:12px;">${escapeHtml(q.question)}</p>
    <div class="grid grid-cols-2 gap-2" style="margin-bottom:12px;">
      <div class="rounded-[10px] p-2" style="background:rgba(255,59,48,0.06);">
        <p class="text-xs" style="color:var(--muted-foreground);margin-bottom:2px;">你的答案</p>
        <p class="text-sm font-medium" style="color:#ff3b30;">${escapeHtml(userOption ? userOption.label : answer.userAnswer)}</p>
      </div>
      <div class="rounded-[10px] p-2" style="background:rgba(52,199,89,0.06);">
        <p class="text-xs" style="color:var(--muted-foreground);margin-bottom:2px;">正确答案</p>
        <p class="text-sm font-medium" style="color:#34c759;">${escapeHtml(correctOption ? correctOption.label : answer.correctAnswer)}</p>
      </div>
    </div>
    <div class="rounded-[10px] p-3" style="background:var(--secondary);">
      <p class="text-xs font-semibold" style="color:var(--foreground);margin-bottom:4px;">原因</p>
      <p class="text-xs" style="color:var(--foreground);">${escapeHtml(q.explanation.correct)}</p>
    </div>
  </div>`;
}

function renderResultActions(wrongCount) {
  const wrongOnlyBtn = wrongCount > 0
    ? `<button type="button" data-action="practice-wrong"
        class="w-full rounded-full text-sm font-semibold transition-all hover:scale-[1.02]"
        style="height:48px;background:rgba(255,149,0,0.1);color:#ff9500;border:1px solid #ff9500;">
        只练错题（${wrongCount} 题）
      </button>`
    : '';

  return `
  <div class="mx-auto flex flex-col gap-3" style="margin-top:40px;max-width:480px;">
    <button type="button" data-action="restart"
      class="w-full rounded-full text-sm font-semibold transition-all hover:scale-[1.02]"
      style="height:48px;background:var(--foreground);color:var(--background);">
      再练一次
    </button>
    ${wrongOnlyBtn}
    <a href="/" data-link="/" class="inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all hover:scale-[1.02]"
      style="height:48px;border:1px solid var(--border);color:var(--foreground);">
      返回训练首页
    </a>
  </div>`;
}

function renderError(message) {
  const safe = escapeHtml(message);
  return `
  <div class="text-center" style="padding:96px 0;">
    <p style="color:var(--muted-foreground);font-size:14px;">${safe}</p>
    <a href="/" data-link="/" class="inline-flex items-center justify-center rounded-full text-sm font-semibold"
      style="margin-top:24px;height:44px;padding:0 24px;background:var(--foreground);color:var(--background);">返回首页</a>
  </div>`;
}

/* ============ 生命周期 ============ */

// 训练首页：无交互逻辑，无需 mount/unmount
export function mountTraining() {
  // 首页为纯静态内容，无事件绑定
}

export function unmountTraining() {
  // 首页无事件需要清理
}

// 好坏对比训练流程：绑定事件委托
export function mountTrainingCompare() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;
  trainingCompareMounted = true;
  container.addEventListener('click', handleContainerClick);
  refreshIcons();
}

export function unmountTrainingCompare() {
  trainingCompareMounted = false;
  // 事件委托绑定在 container 上，container 随 innerHTML 替换后自动回收
  // 无需额外清理
}

/* ============ 事件处理 ============ */

function handleContainerClick(e) {
  // 选项卡片点击
  const optionEl = e.target.closest('[data-option]');
  if (optionEl && state.status !== 'submitted' && state.status !== 'finished') {
    selectOption(optionEl.dataset.option);
    return;
  }

  // 操作按钮点击
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  if (action === 'submit' && state.status === 'selected') {
    submitAnswer();
  } else if (action === 'next' && state.status === 'submitted') {
    nextQuestion();
  } else if (action === 'restart') {
    restart();
  } else if (action === 'practice-wrong') {
    startWrongOnlyPractice();
  } else if (action === 'ai-explain' && state.status === 'submitted') {
    const questionId = actionEl.dataset.questionId;
    if (questionId) requestAiExplain(questionId);
  }
}

/* ============ 状态流转 ============ */

function selectOption(optionId) {
  if (state.status === 'submitted' || state.status === 'finished') return;
  state.selectedOption = optionId;
  state.status = 'selected';
  updateContainer();
}

function submitAnswer() {
  if (state.status !== 'selected' || !state.selectedOption) return;

  const q = shuffledQuestions[state.questionIndex];
  if (!q) return;

  state.status = 'evaluating';
  updateContainer();
  requestAiExplain(q.id, true);
}

function nextQuestion() {
  if (state.status !== 'submitted') return;

  if (state.questionIndex >= shuffledQuestions.length - 1) {
    finishTraining();
    return;
  }

  state.questionIndex += 1;
  state.selectedOption = null;
  state.status = 'question';
  updateContainer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function finishTraining() {
  state.status = 'finished';

  // 持久化本次训练会话到 history（最多保留 20 条）
  recordSession({
    startedAt: state.startedAt,
    finishedAt: Date.now(),
    answers: state.answers,
  });

  updateContainer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restart() {
  trainingMode = 'full';
  shuffledQuestions = prepareQuestions(questions, 8);
  state = createInitialState();
  updateContainer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startWrongOnlyPractice() {
  // 从 localStorage 读取历史错题 id
  const wrongIds = getWrongQuestionIds();
  if (wrongIds.length === 0) {
    // 无错题时刷新当前结果页（理论上按钮不会出现，此处防御）
    updateContainer();
    return;
  }

  // 根据错题 id 从题库中取出对应题目，过滤掉找不到的
  const wrongQuestions = wrongIds
    .map((id) => getQuestionById(id))
    .filter(Boolean);

  if (wrongQuestions.length === 0) {
    updateContainer();
    return;
  }

  trainingMode = 'wrong-only';
  shuffledQuestions = prepareQuestions(wrongQuestions, Math.min(8, wrongQuestions.length), false);
  state = createInitialState();
  updateContainer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 请求 AI 解析
 * - 设置 loading 状态并立即更新 UI
 * - 调用 /api/training/explain 接口
 * - 成功：设置 success 状态
 * - 失败/降级：设置 local 状态（包含 fallbackReason）
 * - 不允许自动重试
 */
async function requestAiExplain(questionId, evaluateAnswer = false) {
  // 防御：已请求过的题目不再重复请求
  if (!evaluateAnswer && aiExplainStates.has(questionId)) {
    const existing = aiExplainStates.get(questionId);
    if (existing.status !== 'idle') return;
  }

  const q = getQuestionById(questionId);
  if (!q) return;
  const displayQuestion = shuffledQuestions.find((item) => item.id === questionId) || q;

  // 设置 loading 状态
  aiExplainStates.set(questionId, { status: 'loading' });
  updateContainer();

  try {
    const images = await Promise.all(displayQuestion.options.map(async (option) => ({
      label: option.label,
      url: await rasterizeFixture(getTrainingFixtureImage(q, option.id)),
    })));
    const response = await fetch('/api/training/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: q.id,
        dimension: q.dimension,
        userAnswer: state.selectedOption,
        question: q.question,
        principle: q.principle,
        images,
        clientId: getClientId(),
      }),
    });

    if (!response.ok) {
      // HTTP 错误：降级为本地解析
      aiExplainStates.set(questionId, {
        status: 'local',
        explanation: buildLocalExplanationFromQuestion(q, state.selectedOption),
        reason: 'provider_error',
      });
      if (evaluateAnswer) finishAnswerWithJudgement(q, displayQuestion, null, true);
      updateContainer();
      return;
    }

    const data = await response.json();

    if (data.provider === 'local') {
      // 服务端降级：使用返回的本地解析
      aiExplainStates.set(questionId, {
        status: 'local',
        explanation: data.explanation,
        reason: data.fallbackReason || 'provider_error',
      });
      if (evaluateAnswer) finishAnswerWithJudgement(q, displayQuestion, data.explanation, false);
    } else {
      // AI 成功
      aiExplainStates.set(questionId, {
        status: 'success',
        explanation: data.explanation,
        provider: data.provider,
      });
      if (evaluateAnswer) finishAnswerWithJudgement(q, displayQuestion, data.explanation, true);
    }
  } catch (err) {
    // 网络错误或 JSON 解析失败：降级为本地解析
    aiExplainStates.set(questionId, {
      status: 'local',
      explanation: buildLocalExplanationFromQuestion(q, state.selectedOption),
      reason: 'network_error',
    });
    if (evaluateAnswer) finishAnswerWithJudgement(q, displayQuestion, null, false);
  }

  updateContainer();
}

function rasterizeFixture(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 600;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch (_) {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function finishAnswerWithJudgement(q, displayQuestion, explanation, aiJudged) {
  const aiLabel = aiJudged && ['A', 'B'].includes(String(explanation?.bestOption || '').toUpperCase())
    ? String(explanation.bestOption).toUpperCase()
    : null;
  const judgedOption = aiLabel
    ? displayQuestion.options.find((option) => option.label === aiLabel)
    : null;
  const judgedAnswer = judgedOption?.id || q.answer;
  const isCorrect = state.selectedOption === judgedAnswer;

  state.answers.push({
    questionId: q.id,
    dimension: q.dimension,
    userAnswer: state.selectedOption,
    correctAnswer: judgedAnswer,
    isCorrect,
    aiJudged: Boolean(aiLabel),
  });
  recordAnswer(q.id, state.selectedOption, judgedAnswer);
  state.status = 'submitted';
}

/**
 * 从题目数据构建本地解析（前端兜底，与服务端 buildLocalExplanation 逻辑一致）
 */
function buildLocalExplanationFromQuestion(q, userAnswer) {
  const isCorrect = userAnswer === q.answer;
  return {
    bestOption: null,
    confidence: null,
    observation: isCorrect
      ? `你的选择是正确的。${q.explanation.correct}`
      : `你选择了 ${String(userAnswer).toUpperCase()}，但正确答案是 ${String(q.answer).toUpperCase()}。${q.explanation.correct}`,
    principle: `${q.principle}原则：请参考本题解析中的设计原则说明。`,
    suggestion: q.explanation.correct,
    memoryTip: '建议回顾本题的设计原则说明，加深理解。',
  };
}

function prepareQuestions(list, count = 8, avoidRecent = true) {
  const recentIds = avoidRecent ? new Set(getRecentQuestionIds(20)) : new Set();
  const fresh = list.filter((question) => !recentIds.has(question.id));
  const candidates = fresh.length >= count ? fresh : list;
  const selected = [];
  for (const question of shuffleQuestions(candidates)) {
    if (selected.length >= count) break;
    const previous = selected[selected.length - 1];
    if (previous && previous.dimension === question.dimension && candidates.some((item) => item.dimension !== previous.dimension && !selected.includes(item))) {
      continue;
    }
    selected.push(question);
  }
  if (selected.length < count) {
    for (const question of shuffleQuestions(candidates)) {
      if (selected.length >= count) break;
      if (!selected.includes(question)) selected.push(question);
    }
  }
  return selected.map((question, index) => {
    const correct = question.options.find((option) => option.id === question.answer);
    const wrong = question.options.find((option) => option.id !== question.answer);
    const ordered = index % 2 === 0 ? [correct, wrong] : [wrong, correct];
    return {
      ...question,
      options: ordered.map((option, optionIndex) => ({
        ...option,
        label: optionIndex === 0 ? 'A' : 'B',
      })),
    };
  }).filter((question) => question.options.every(Boolean));
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

/**
 * 计算各维度的答题统计
 * @param {Array} answers
 * @returns {Object} { contrast: {total, correct}, ... }
 */
function computeDimensionStats(answers) {
  const stats = {
    contrast: { total: 0, correct: 0 },
    alignment: { total: 0, correct: 0 },
    repetition: { total: 0, correct: 0 },
    proximity: { total: 0, correct: 0 },
  };
  for (const a of answers) {
    if (!stats[a.dimension]) continue;
    stats[a.dimension].total += 1;
    if (a.isCorrect) stats[a.dimension].correct += 1;
  }
  return stats;
}

/**
 * 找出正确率最低的维度（仅在 total > 0 的维度中比较）
 * @param {Object} dimensionStats
 * @returns {Object|null} { dimension, accuracy } 或 null（全部答对时）
 */
function findWeakestDimension(dimensionStats) {
  let weakest = null;
  for (const [dim, s] of Object.entries(dimensionStats)) {
    if (s.total === 0) continue;
    const accuracy = s.correct / s.total;
    if (!weakest || accuracy < weakest.accuracy) {
      weakest = { dimension: dim, accuracy: Math.round(accuracy * 1000) / 10 };
    }
  }
  return weakest;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}
