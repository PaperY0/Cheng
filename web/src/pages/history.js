import { getAllHistory, deleteHistoryRecord, clearHistory } from '../profileStore.js';

let activeFilter = 'all';

export function renderHistory() {
  const records = getAllHistory().filter((record) => activeFilter === 'all' || record.type === activeFilter);
  return `
  <section class="mx-auto max-w-[1040px] px-5 md:px-8" style="padding:48px 0 96px;">
    <div class="glass-panel history-header" data-reveal><div><p class="eyebrow">TIMELINE</p><h1>历史记录</h1><p>回顾每一次训练与诊断，把进步变成可见的轨迹。</p></div><button type="button" class="glass-button danger-soft" data-history-clear>清空当前${activeFilter === 'all' ? '全部' : activeFilter === 'diagnosis' ? '诊断' : '训练'}记录</button></div>
    <div class="filter-bar glass-panel" data-reveal-stagger>${filterButton('all', '全部')} ${filterButton('training', '训练')} ${filterButton('diagnosis', '诊断')}</div>
    <div class="history-list" data-reveal-stagger>${records.length ? records.map(renderHistoryRow).join('') : `<div class="glass-panel empty-state"><i data-lucide="archive"></i><strong>这里还没有记录</strong><span>完成一次训练或诊断后，结果会自动出现在这里。</span><a href="/training" data-link="/training" class="glass-button primary">去训练</a></div>`}</div>
    <div id="history-modal-root"></div>
  </section>`;
}

function filterButton(value, label) { return `<button type="button" class="filter-chip ${activeFilter === value ? 'active' : ''}" data-history-filter="${value}">${label}</button>`; }
function renderHistoryRow(record) { const view = record.route ? `<a href="${escapeHtml(record.route)}" data-link="${escapeHtml(record.route)}" class="glass-button">查看</a>` : ''; return `<article class="glass-panel history-card" data-history-id="${escapeHtml(record.id)}"><div class="history-row-icon"><i data-lucide="${record.type === 'diagnosis' ? 'image' : 'activity'}"></i></div><div class="history-row-main"><strong>${escapeHtml(record.title)}</strong><span>${record.type === 'diagnosis' ? 'AI 设计诊断' : '审美训练'} · ${formatDate(record.createdAt)}</span></div><div class="history-card-score"><b>${record.score ? `${record.score}分` : '—'}</b><span>${escapeHtml(record.summary || '已完成')}</span></div>${view}<button type="button" class="icon-button" data-history-delete="${escapeHtml(record.id)}" aria-label="删除记录"><i data-lucide="trash-2"></i></button></article>`; }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '刚刚' : date.toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }

export function mountHistory() {
  const root = document.getElementById('app');
  if (!root) return;
  root.addEventListener('click', handleHistoryClick);
  root.__historyClickHandler = handleHistoryClick;
}

function handleHistoryClick(event) {
  const root = document.getElementById('app');
  if (!root) return;
    const filter = event.target.closest('[data-history-filter]');
    if (filter) { activeFilter = filter.dataset.historyFilter; window.dispatchEvent(new PopStateEvent('popstate')); return; }
    const deleteButton = event.target.closest('[data-history-delete]');
    if (deleteButton && window.confirm('确认删除这条记录吗？删除后无法恢复。')) {
      deleteHistoryRecord(deleteButton.dataset.historyDelete);
      deleteButton.closest('[data-history-id]')?.remove();
    }
    const clearButton = event.target.closest('[data-history-clear]');
    if (clearButton && window.confirm('确认清空当前历史记录吗？此操作无法恢复。')) {
      clearHistory(activeFilter === 'all' ? undefined : activeFilter);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
}

export function unmountHistory() {
  const root = document.getElementById('app');
  if (root?.__historyClickHandler) root.removeEventListener('click', root.__historyClickHandler);
  if (root) delete root.__historyClickHandler;
}
