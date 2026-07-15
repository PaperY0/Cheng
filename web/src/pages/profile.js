import { getAllHistory, getProfileStats, deleteHistoryRecord } from '../profileStore.js';
import { mountCountUps } from '../countUp.js';

const DIMENSIONS = { layout: '排版与布局', color: '配色', typography: '字体与文字层级', whitespace: '留白与视觉平衡' };

export function renderProfile() {
  const stats = getProfileStats();
  const recent = stats.recent || [];
  const all = getAllHistory();
  const weakest = Object.entries(stats.dimensions).filter(([, score]) => score > 0).sort((a, b) => a[1] - b[1])[0];
  return `
  <section class="mx-auto max-w-[1180px] px-5 md:px-8" style="padding:48px 0 96px;">
    <div class="profile-hero glass-panel" data-reveal>
      <div class="profile-hero-icon"><i data-lucide="user-round"></i></div>
      <div><p class="eyebrow">PERSONAL SPACE</p><h1>个人中心</h1><p>记录你的训练轨迹，持续看见审美能力的变化。</p></div>
      <div class="profile-actions"><a href="/training" data-link="/training" class="glass-button primary">开始训练</a><a href="/diagnosis/new" data-link="/diagnosis/new" class="glass-button">立即诊断</a></div>
    </div>
    <div class="profile-metrics" data-reveal-stagger>
      ${metric('训练次数', stats.trainingCount, 'dumbbell', true)} ${metric('诊断次数', stats.diagnosisCount, 'scan-search', true)} ${metric('综合能力', stats.averageScore, 'sparkles', true, '分')} ${metric('最近记录', all.length ? formatDate(all[0].createdAt) : '暂无', 'clock-3')}
    </div>
    <div class="profile-grid">
      <section class="glass-panel profile-card" data-reveal>
        <div class="section-heading"><div><p class="eyebrow">ABILITY MAP</p><h2>能力画像</h2></div><span class="soft-badge">${weakest ? `重点提升：${DIMENSIONS[weakest[0]]}` : '完成训练后生成'}</span></div>
        <div class="dimension-list">${Object.entries(DIMENSIONS).map(([key, label]) => dimensionRow(label, stats.dimensions[key])).join('')}</div>
      </section>
      <section class="glass-panel profile-card" data-reveal>
        <div class="section-heading"><div><p class="eyebrow">RECENT ACTIVITY</p><h2>最近记录</h2></div><a href="/history" data-link="/history" class="text-link">查看全部</a></div>
        ${recent.length ? recent.map(renderRecord).join('') : emptyState('还没有训练记录', '完成一次训练或诊断后，结果会自动保存在这里。', '/training', '开始第一次训练')}
      </section>
    </div>
    <section class="glass-panel profile-card" data-reveal>
      <div class="section-heading"><div><p class="eyebrow">QUICK ACCESS</p><h2>继续提升</h2></div></div>
      <div class="quick-grid"><a href="/training/compare" data-link="/training/compare" class="quick-card"><i data-lucide="layers"></i><strong>好坏对比</strong><span>建立审美判断基准</span></a><a href="/training/spot" data-link="/training/spot" class="quick-card"><i data-lucide="scan-search"></i><strong>找茬训练</strong><span>训练观察与问题识别</span></a><a href="/training/scoring" data-link="/training/scoring" class="quick-card"><i data-lucide="sliders-horizontal"></i><strong>维度打分</strong><span>校准你的审美标尺</span></a></div>
    </section>
    <div id="profile-modal-root"></div>
  </section>`;
}

function metric(label, value, icon, animated = false, suffix = '') { return `<div class="glass-panel metric-card"><i data-lucide="${icon}"></i><span>${label}</span><strong>${animated ? `<span class="count-up-text" data-count-up data-count-to="${Number(value) || 0}" data-count-duration="1" data-count-suffix="${suffix}">0${suffix}</span>` : value}</strong></div>`; }
function dimensionRow(label, score) { const value = score ? Math.min(100, score > 10 ? score : score * 10) : 0; return `<div class="dimension-row"><div><span>${label}</span><b>${score ? `${score}${score <= 10 ? '/10' : '分'}` : '待训练'}</b></div><div class="progress-track"><i style="width:${value}%"></i></div></div>`; }
function renderRecord(record) { return `<div class="history-row"><div class="history-row-icon"><i data-lucide="${record.type === 'diagnosis' ? 'image' : 'activity'}"></i></div><div class="history-row-main"><strong>${escapeHtml(record.title)}</strong><span>${record.type === 'diagnosis' ? 'AI 诊断' : '审美训练'} · ${formatDate(record.createdAt)}</span></div><b class="history-score">${record.score ? `${record.score}分` : '—'}</b><button type="button" class="icon-button" data-profile-delete="${escapeHtml(record.id)}" aria-label="删除记录"><i data-lucide="trash-2"></i></button></div>`; }
function emptyState(title, text, href, label) { return `<div class="empty-state"><i data-lucide="inbox"></i><strong>${title}</strong><span>${text}</span><a href="${href}" data-link="${href}" class="glass-button primary">${label}</a></div>`; }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '刚刚' : date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }

function handleProfileClick(event) {
  const button = event.target.closest('[data-profile-delete]');
  if (!button) return;
  if (window.confirm('确认删除这条记录吗？删除后无法恢复。')) {
    deleteHistoryRecord(button.dataset.profileDelete);
    button.closest('.history-row')?.remove();
  }
}

export function mountProfile() {
  const root = document.querySelector('[data-profile-root]') || document.body;
  const stopCountUps = mountCountUps(root);
  root.__profileCountUpsCleanup = stopCountUps;
  root.addEventListener('click', handleProfileClick);
  root.__profileClickHandler = handleProfileClick;
}
export function unmountProfile() {
  const root = document.querySelector('[data-profile-root]') || document.body;
  if (root.__profileClickHandler) root.removeEventListener('click', root.__profileClickHandler);
  delete root.__profileClickHandler;
  root.__profileCountUpsCleanup?.();
  delete root.__profileCountUpsCleanup;
}
