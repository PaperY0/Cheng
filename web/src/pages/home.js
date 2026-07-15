// 首页 - 迁移自 meishang-tool-station/pages/index.html
// 保留全部视觉结构，CTA 和导航改为真实路由
import { getHistoryByType } from '../profileStore.js';

export function renderHome() {
  const recent = getHistoryByType('diagnosis').slice(0, 3);
  return `
  <!-- Hero -->
  <section class="relative flex min-h-[78vh] flex-col items-center justify-center px-6 text-center" style="padding-top:96px;padding-bottom:48px;">
    <div style="font-family:'Playfair Display','Times New Roman',Georgia,serif;">
      <h1 class="hero-reveal hero-reveal-delay-1" style="font-weight:700;font-size:clamp(44px,7vw,88px);line-height:1.08;letter-spacing:-0.04em;text-wrap:balance;word-break:keep-all;overflow-wrap:break-word;background:linear-gradient(90deg, #67e8f9 0%, #22d3ee 40%, #0891b2 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;">
        让每个 AI 创作者<br>都能精准识别和表达设计需求
      </h1>
      <div class="hero-reveal hero-reveal-delay-2 mt-12 flex items-center justify-center gap-4">
        <a href="/diagnosis/new" data-link="/diagnosis/new" class="inline-flex h-12 items-center justify-center rounded-full px-8 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:16px;font-weight:600;">
          立即诊断
        </a>
        <a href="/training" data-link="/training" class="inline-flex h-12 items-center justify-center rounded-full px-8 transition-colors hover:bg-[var(--secondary)]" style="border:1px solid var(--border);background:transparent;color:var(--foreground);font-size:16px;font-weight:500;">
          开始训练
        </a>
      </div>
    </div>
  </section>

  <!-- 最近诊断 -->
  ${recent.length ? `
  <section class="mx-auto max-w-[1200px] px-6" style="padding-top:0;padding-bottom:96px;">
    <div class="flex items-center justify-between mb-6">
      <h2 data-reveal style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:600;font-size:clamp(24px,3vw,32px);color:var(--foreground);letter-spacing:-0.02em;">最近诊断</h2>
      <a href="/history" data-link="/history" class="text-sm" style="color:var(--foreground);font-weight:600;">查看全部</a>
    </div>
    <div class="flex flex-col gap-3">
      ${recent.map((item) => {
        const route = item.route || '/history';
        const designType = item.meta?.designType;
        return `
      <a href="${escapeHtml(route)}" data-link="${escapeHtml(route)}" data-reveal class="flex items-center gap-4 rounded-[20px] border p-4 transition-transform hover:scale-[1.01]" style="border-color:var(--border);background:var(--card);">
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]" style="background:var(--secondary);"><i data-lucide="image" class="w-5 h-5" style="color:var(--foreground);"></i></span>
        <span class="min-w-0 flex-1"><span class="block truncate text-sm" style="color:var(--foreground);font-weight:600;">${escapeHtml(item.title)}</span><span class="mt-1 block text-xs" style="color:var(--muted-foreground);">${designType === 'graphic' ? '平面设计' : '界面设计'} · ${formatRecentTime(item.createdAt)}</span></span>
        <span class="text-lg" style="color:${item.score >= 80 ? '#34c759' : item.score >= 60 ? '#ff9500' : '#ff3b30'};font-weight:700;">${item.score}分</span>
      </a>`;
      }).join('')}
    </div>
  </section>` : ''}

  <!-- 进度条带 -->
  <section class="mx-auto max-w-[1200px] px-6" style="padding-top:0;padding-bottom:96px;">
    <div data-reveal class="rounded-[28px] border p-6 md:p-8" style="border-color:var(--border);background:var(--card);">
      <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style="background:var(--secondary);">
            <i data-lucide="dumbbell" class="w-5 h-5" style="color:var(--foreground);"></i>
          </span>
          <div>
            <h3 style="font-weight:600;color:var(--foreground);">继续你的练习</h3>
            <p class="mt-1 text-sm" style="color:var(--muted-foreground);">今日已完成 3/10 题 · 连续打卡 5 天</p>
          </div>
        </div>
        <div class="flex-1 md:mx-8">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs" style="color:var(--muted-foreground);">今日进度</span>
            <span class="text-xs" style="color:var(--foreground);font-weight:600;">30%</span>
          </div>
          <div class="h-2 w-full rounded-full" style="background:var(--secondary);">
            <div class="h-2 rounded-full" style="width:30%;background:var(--foreground);"></div>
          </div>
        </div>
        <a href="/training" data-link="/training" class="inline-flex h-11 shrink-0 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
          继续训练
        </a>
      </div>
    </div>
  </section>

  <!-- 痛点 -->
  <section class="mx-auto max-w-[1200px] px-6" style="padding-top:96px;padding-bottom:96px;">
    <h2 data-reveal class="mb-12 text-center" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:600;font-size:clamp(24px,3vw,32px);color:var(--foreground);letter-spacing:-0.02em;">你是否也遇到过这些问题？</h2>
    <div data-reveal-stagger class="flex gap-6">
      <div class="flex-1 rounded-[28px] border p-8" style="border-color:var(--border);background:var(--card);">
        <i data-lucide="eye-off" class="w-5 h-5" style="color:var(--foreground);"></i>
        <h3 class="mt-4" style="font-weight:600;color:var(--foreground);">看不出问题</h3>
        <p class="mt-2 text-sm" style="color:var(--muted-foreground);">面对设计稿，无法识别问题所在</p>
      </div>
      <div class="flex-1 rounded-[28px] border p-8" style="border-color:var(--border);background:var(--card);">
        <i data-lucide="message-square-off" class="w-5 h-5" style="color:var(--foreground);"></i>
        <h3 class="mt-4" style="font-weight:600;color:var(--foreground);">说不清需求</h3>
        <p class="mt-2 text-sm" style="color:var(--muted-foreground);">知道不好看，但说不清哪里不好</p>
      </div>
      <div class="flex-1 rounded-[28px] border p-8" style="border-color:var(--border);background:var(--card);">
        <i data-lucide="wrench" class="w-5 h-5" style="color:var(--foreground);"></i>
        <h3 class="mt-4" style="font-weight:600;color:var(--foreground);">不知道怎么改</h3>
        <p class="mt-2 text-sm" style="color:var(--muted-foreground);">发现问题后，不知道如何修改</p>
      </div>
    </div>
  </section>

  <!-- 核心功能 -->
  <section class="mx-auto max-w-[1200px] px-6" style="padding-top:96px;padding-bottom:96px;">
    <h2 data-reveal class="mb-12 text-center" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:600;font-size:clamp(24px,3vw,32px);color:var(--foreground);letter-spacing:-0.02em;">核心功能</h2>
    <div data-reveal-stagger class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <div class="rounded-[28px] border-2 p-6" style="border-color:var(--foreground);background:var(--card);">
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full" style="background:var(--foreground);"></span>
          <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--foreground);color:var(--background);">MVP</span>
        </div>
        <h3 class="mt-3" style="font-weight:600;color:var(--foreground);">审美训练</h3>
        <p class="mt-2 text-sm" style="color:var(--muted-foreground);">通过对比、找茬、打分训练审美判断力</p>
      </div>
      <div class="rounded-[28px] border-2 p-6" style="border-color:var(--foreground);background:var(--card);">
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full" style="background:var(--foreground);"></span>
          <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--foreground);color:var(--background);">MVP</span>
        </div>
        <h3 class="mt-3" style="font-weight:600;color:var(--foreground);">AI诊断</h3>
        <p class="mt-2 text-sm" style="color:var(--muted-foreground);">上传设计图，AI精准诊断并给修改建议</p>
      </div>
      <div class="rounded-[28px] border p-6" style="border-color:var(--border);background:var(--secondary);opacity:0.6;">
        <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--secondary);color:var(--muted-foreground);">即将上线</span>
        <h3 class="mt-3" style="font-weight:600;color:var(--foreground);">提示词训练</h3>
      </div>
      <div class="rounded-[28px] border p-6" style="border-color:var(--border);background:var(--secondary);opacity:0.6;">
        <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--secondary);color:var(--muted-foreground);">即将上线</span>
        <h3 class="mt-3" style="font-weight:600;color:var(--foreground);">知识库</h3>
      </div>
      <div class="rounded-[28px] border p-6" style="border-color:var(--border);background:var(--secondary);opacity:0.6;">
        <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--secondary);color:var(--muted-foreground);">即将上线</span>
        <h3 class="mt-3" style="font-weight:600;color:var(--foreground);">素材库</h3>
      </div>
    </div>
  </section>

  <!-- 定价 -->
  <section class="mx-auto max-w-[1200px] px-6" style="padding-top:96px;padding-bottom:128px;">
    <h2 data-reveal class="mb-12 text-center" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:600;font-size:clamp(24px,3vw,32px);color:var(--foreground);letter-spacing:-0.02em;">选择你的计划</h2>
    <div data-reveal-stagger class="flex gap-6">
      <div class="flex-1 rounded-[28px] border p-8" style="border-color:var(--border);background:var(--card);">
        <h3 class="text-lg" style="font-weight:600;color:var(--foreground);">免费版</h3>
        <div class="mt-4 text-3xl"><span style="font-weight:700;color:var(--foreground);">¥0</span></div>
        <ul class="mt-6 flex flex-col gap-2 text-sm" style="color:var(--muted-foreground);">
          <li>诊断 3次/日</li>
          <li>训练 10题/日</li>
          <li>基础诊断报告</li>
        </ul>
      </div>
      <div class="flex-1 rounded-[28px] border-2 p-8" style="border-color:var(--foreground);background:var(--card);">
        <div class="flex items-center gap-3">
          <h3 class="text-lg" style="font-weight:600;color:var(--foreground);">订阅版</h3>
          <span class="rounded-full px-2 py-0.5 text-xs" style="background:var(--foreground);color:var(--background);">推荐</span>
        </div>
        <div class="mt-4 text-3xl"><span style="font-weight:700;color:var(--foreground);">¥39</span><span style="font-weight:700;color:var(--foreground);">/月</span></div>
        <ul class="mt-6 flex flex-col gap-2 text-sm" style="color:var(--muted-foreground);">
          <li>无限诊断</li>
          <li>无限训练</li>
          <li>批量对比</li>
          <li>修改前后预览</li>
          <li>详细诊断报告</li>
        </ul>
        <button type="button" class="mt-8 rounded-full px-6 py-3 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);">升级订阅</button>
      </div>
    </div>
  </section>`;
}

function formatRecentTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '刚刚' : date.toLocaleDateString('zh-CN');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
