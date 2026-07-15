// 诊断动态路由占位页 - 仅保留 compare 占位和 404
// setup/processing/report 已有独立页面模块

export function renderCompare(taskId) {
  return `
  <section class="mx-auto max-w-[800px] px-6" style="padding-top:96px;padding-bottom:96px;">
    <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
      <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:var(--secondary);">
        <i data-lucide="git-compare" class="w-7 h-7" style="color:var(--foreground);"></i>
      </span>
      <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:32px;color:var(--foreground);letter-spacing:-0.02em;">版本对比 - 功能即将接入</h1>
      <p class="mt-3 text-sm" style="color:var(--muted-foreground);">该步骤是诊断主闭环的一部分，版本对比能力将在后续版本中提供。</p>
      <div class="mt-6 rounded-[16px] border p-4 text-left" style="border-color:var(--border);background:var(--secondary);">
        <p class="text-xs" style="color:var(--muted-foreground);">任务 ID</p>
        <p class="mt-1 text-sm font-mono" style="color:var(--foreground);font-family:var(--font-mono);">${taskId}</p>
      </div>
      <a href="/diagnosis/new" data-link="/diagnosis/new" class="mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        返回新建诊断
      </a>
    </div>
  </section>`;
}

// 404 页面
export function renderNotFound(path) {
  return `
  <section class="mx-auto max-w-[800px] px-6" style="padding-top:96px;padding-bottom:96px;">
    <div data-reveal class="rounded-[28px] border p-8 md:p-12 text-center" style="border-color:var(--border);background:var(--card);">
      <span class="flex h-16 w-16 mx-auto items-center justify-center rounded-full" style="background:var(--secondary);">
        <i data-lucide="compass" class="w-7 h-7" style="color:var(--foreground);"></i>
      </span>
      <h1 class="mt-6" style="font-family:'Playfair Display','Times New Roman',Georgia,serif;font-weight:700;font-size:48px;color:var(--foreground);letter-spacing:-0.02em;">404</h1>
      <p class="mt-2 text-sm" style="color:var(--muted-foreground);">页面不存在</p>
      <p class="mt-1 text-xs font-mono break-all" style="color:var(--muted-foreground);font-family:var(--font-mono);">${path}</p>
      <a href="/" data-link="/" class="mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 transition-transform hover:scale-[1.02]" style="background:var(--foreground);color:var(--background);font-size:15px;font-weight:600;">
        返回首页
      </a>
    </div>
  </section>`;
}
