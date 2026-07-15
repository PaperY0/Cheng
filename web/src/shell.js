import { navigate } from './router.js';

// 共享导航栏 - 保留设计源视觉结构，真实路由跳转
export function renderNavbar(activeKey) {
  const isActive = (key) => (key === activeKey ? 'data-active="true"' : '');
  return `
  <nav class="frosted-nav sticky top-0 z-50 w-full" style="height:48px;" aria-label="主导航">
    <div class="mx-auto flex h-full max-w-[1200px] items-center gap-6 px-6">
      <a href="/" data-link="/" class="flex shrink-0 items-center whitespace-nowrap" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:18px;color:var(--foreground);letter-spacing:-0.02em;" aria-label="美商培养工具站首页">
        美商
      </a>
      <div class="nav-links flex items-center gap-1" data-active-key="${activeKey}">
        <span class="nav-active-pill" aria-hidden="true"></span>
        <a href="/diagnosis/new" data-link="/diagnosis/new" data-nav-key="diagnosis" ${isActive('diagnosis')} class="nav-link inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-sm font-semibold transition-colors" style="color:var(--foreground);">立即诊断</a>
        <a href="/training" data-link="/training" data-nav-key="training" ${isActive('training')} class="nav-link inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-sm transition-colors" style="color:var(--foreground);">审美训练</a>
        <span class="inline-flex h-8 shrink-0 cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm" style="color:var(--muted-foreground);">知识库 <span class="rounded-full px-1.5 py-0.5 text-xs leading-tight" style="background:var(--secondary);color:var(--muted-foreground);">即将上线</span></span>
        <span class="inline-flex h-8 shrink-0 cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm" style="color:var(--muted-foreground);">素材库 <span class="rounded-full px-1.5 py-0.5 text-xs leading-tight" style="background:var(--secondary);color:var(--muted-foreground);">即将上线</span></span>
      </div>
      <div class="ml-auto flex shrink-0 items-center">
        <a href="/profile" data-link="/profile" ${isActive('profile')} class="profile-nav-link inline-flex h-9 w-12 items-center justify-center rounded-[18px] transition-transform hover:scale-105" style="color:#007aff;" aria-label="个人中心">
          <span class="profile-nav-icon"><i data-lucide="user-round" class="h-5 w-5"></i></span>
        </a>
      </div>
    </div>
  </nav>`;
}

export function syncNavPill() {
  const group = document.querySelector('.nav-links');
  const pill = group?.querySelector('.nav-active-pill');
  const active = group?.querySelector('.nav-link[data-active="true"]');
  if (!group || !pill || !active) { if (pill) pill.style.opacity = '0'; return; }
  const groupRect = group.getBoundingClientRect();
  const linkRect = active.getBoundingClientRect();
  pill.style.width = `${linkRect.width}px`;
  pill.style.transform = `translateX(${linkRect.left - groupRect.left}px)`;
  pill.style.opacity = '1';
}

// 共享页脚 - 保留设计源结构，真实路由跳转
export function renderFooter() {
  return `
  <footer class="mx-auto max-w-[1200px] px-6" style="padding-top:48px;padding-bottom:48px;">
    <div class="flex flex-col items-center gap-4 text-center">
      <a href="/" data-link="/" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:16px;color:var(--foreground);">美商培养工具站</a>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <a href="/diagnosis/new" data-link="/diagnosis/new" class="whitespace-nowrap text-xs transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">立即诊断</a>
        <span style="color:var(--muted-foreground);">·</span>
        <a href="/training" data-link="/training" class="whitespace-nowrap text-xs transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">审美训练</a>
        <span style="color:var(--muted-foreground);">·</span>
        <a href="/profile" data-link="/profile" class="whitespace-nowrap text-xs transition-opacity hover:opacity-70" style="color:var(--muted-foreground);">个人中心</a>
      </div>
    </div>
  </footer>`;
}

// 统一页面壳：导航 + 内容 + 页脚
export function renderPage(activeKey, contentHtml) {
  return `<main>${renderNavbar(activeKey)}${contentHtml}${renderFooter()}</main>`;
}

// 拦截 [data-link] 点击，走客户端路由
export function bindLinkClicks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (!link) return;
    const path = link.getAttribute('data-link');
    if (!path) return;
    e.preventDefault();
    navigate(path);
  });
}
