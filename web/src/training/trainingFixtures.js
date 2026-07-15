// 程序生成的页面设计训练图。
// 10 种独立布局模板，每种支持 4 个维度的 good/bad 变体。
// 只用 SVG 绘制 UI 界面，不依赖任何摄影图库（Pexels/Unsplash 等）。

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[char]));
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// 画布外壳：960×600，浅色背景
function shell(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
    <rect width="960" height="600" rx="20" fill="#f8fafc"/>
    ${content}
  </svg>`;
}

/* ============ 布局模板 0：SaaS 着陆页 ============ */
function layout0(dimension, isGood) {
  // 顶部导航 + hero(标题/副标题/CTA) + 三特性卡片
  const nav = `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/>
    <circle cx="80" cy="68" r="10" fill="#2563eb"/><text x="100" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#172033">Northstar</text>
    <text x="780" y="73" font-family="Arial" font-size="13" fill="#64748b">产品　方案　资源</text>`;

  let hero;
  let cards;
  if (dimension === 'contrast') {
    if (isGood) {
      hero = `<text x="80" y="180" font-family="Arial" font-size="40" font-weight="700" fill="#172033">让复杂工作变简单</text>
        <text x="82" y="218" font-family="Arial" font-size="16" fill="#64748b">一个清晰的工作台，帮助团队专注于重要的事。</text>
        <rect x="80" y="252" width="170" height="50" rx="12" fill="#2563eb"/><text x="120" y="283" font-family="Arial" font-size="15" font-weight="700" fill="#fff">开始使用</text>
        <rect x="270" y="252" width="140" height="50" rx="12" fill="#fff" stroke="#cbd5e1"/><text x="305" y="283" font-family="Arial" font-size="15" fill="#334155">了解更多</text>`;
      cards = [180, 420, 660].map((x) => `<rect x="${x}" y="360" width="200" height="170" rx="16" fill="#eff6ff"/><text x="${x + 24}" y="400" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能</text><text x="${x + 24}" y="440" font-family="Arial" font-size="13" fill="#64748b">简短说明文字</text>`).join('');
    } else {
      hero = `<text x="80" y="178" font-family="Arial" font-size="22" fill="#475569">让复杂工作变简单</text>
        <text x="82" y="212" font-family="Arial" font-size="18" fill="#64748b">一个清晰的工作台，帮助团队专注于重要的事。</text>
        <rect x="80" y="252" width="170" height="50" rx="12" fill="#94a3b8"/><text x="120" y="283" font-family="Arial" font-size="15" fill="#fff">开始使用</text>
        <rect x="270" y="252" width="140" height="50" rx="12" fill="#94a3b8"/><text x="305" y="283" font-family="Arial" font-size="15" fill="#fff">了解更多</rect>`;
      cards = [180, 420, 660].map((x) => `<rect x="${x}" y="360" width="200" height="170" rx="16" fill="#f1f5f9"/><text x="${x + 24}" y="398" font-family="Arial" font-size="18" fill="#64748b">功能</text><text x="${x + 24}" y="440" font-family="Arial" font-size="15" fill="#94a3b8">简短说明文字</text>`).join('');
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      hero = `<text x="80" y="180" font-family="Arial" font-size="32" font-weight="700" fill="#172033">让复杂工作变简单</text>
        <text x="80" y="214" font-family="Arial" font-size="14" fill="#64748b">一个清晰的工作台，帮助团队专注于重要的事。</text>
        <rect x="80" y="250" width="160" height="46" rx="12" fill="#2563eb"/><text x="118" y="278" font-family="Arial" font-size="14" font-weight="700" fill="#fff">开始使用</text>`;
      cards = [80, 320, 560].map((x) => `<rect x="${x}" y="350" width="220" height="170" rx="14" fill="#f8fafc"/><text x="${x + 24}" y="390" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能</text><text x="${x + 24}" y="420" font-family="Arial" font-size="12" fill="#64748b">简短说明文字</text>`).join('');
    } else {
      hero = `<text x="110" y="180" font-family="Arial" font-size="32" font-weight="700" fill="#172033">让复杂工作变简单</text>
        <text x="140" y="218" font-family="Arial" font-size="14" fill="#64748b">一个清晰的工作台，帮助团队专注于重要的事。</text>
        <rect x="95" y="258" width="160" height="46" rx="12" fill="#2563eb"/><text x="133" y="286" font-family="Arial" font-size="14" font-weight="700" fill="#fff">开始使用</text>`;
      cards = `<rect x="80" y="358" width="220" height="150" rx="14" fill="#f8fafc"/><text x="104" y="396" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能</text>
        <rect x="340" y="338" width="220" height="180" rx="14" fill="#f8fafc"/><text x="364" y="378" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能</text>
        <rect x="600" y="372" width="220" height="130" rx="14" fill="#f8fafc"/><text x="624" y="410" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能</text>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      hero = `<text x="80" y="180" font-family="Arial" font-size="32" font-weight="700" fill="#172033">让复杂工作变简单</text>
        <text x="80" y="214" font-family="Arial" font-size="14" fill="#64748b">一个清晰的工作台，帮助团队专注于重要的事。</text>
        <rect x="80" y="250" width="160" height="46" rx="12" fill="#2563eb"/><text x="118" y="278" font-family="Arial" font-size="14" font-weight="700" fill="#fff">开始使用</text>`;
      cards = [80, 320, 560].map((x) => `<rect x="${x}" y="350" width="220" height="170" rx="16" fill="#fff" stroke="#dbe4ef"/><circle cx="${x + 40}" cy="390" r="14" fill="#dbeafe"/><text x="${x + 68}" y="395" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能</text><rect x="${x + 24}" y="430" width="172" height="10" rx="5" fill="#e2e8f0"/>`).join('');
    } else {
      hero = `<text x="80" y="180" font-family="Arial" font-size="32" font-weight="700" fill="#172033">让复杂工作变简单</text>
        <text x="80" y="214" font-family="Arial" font-size="14" fill="#64748b">一个清晰的工作台，帮助团队专注于重要的事。</text>
        <rect x="80" y="250" width="160" height="46" rx="4" fill="#2563eb"/><text x="118" y="278" font-family="Arial" font-size="14" font-weight="700" fill="#fff">开始使用</text>`;
      cards = `<rect x="80" y="350" width="220" height="170" rx="4" fill="#fff" stroke="#f59e0b"/><text x="104" y="390" font-family="Arial" font-size="18" fill="#172033">功能一</text>
        <rect x="320" y="370" width="220" height="150" rx="28" fill="#fef3c7"/><text x="344" y="410" font-family="Arial" font-size="22" font-weight="700" fill="#172033">功能二</text>
        <rect x="560" y="340" width="220" height="180" rx="0" fill="#f1f5f9"/><text x="584" y="378" font-family="Arial" font-size="13" fill="#172033">功能三</text>`;
    }
  } else {
    // proximity
    if (isGood) {
      hero = `<text x="80" y="180" font-family="Arial" font-size="32" font-weight="700" fill="#172033">让复杂工作变简单</text>
        <text x="80" y="206" font-family="Arial" font-size="14" fill="#64748b">一个清晰的工作台。</text>
        <rect x="80" y="226" width="160" height="46" rx="12" fill="#2563eb"/><text x="118" y="254" font-family="Arial" font-size="14" font-weight="700" fill="#fff">开始使用</text>`;
      cards = [80, 320, 560].map((x) => `<rect x="${x}" y="320" width="220" height="170" rx="16" fill="#f8fafc"/><text x="${x + 24}" y="356" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能</text><text x="${x + 24}" y="378" font-family="Arial" font-size="12" fill="#64748b">说明</text>`).join('');
    } else {
      hero = `<text x="80" y="180" font-family="Arial" font-size="32" font-weight="700" fill="#172033">让复杂工作变简单</text>
        <text x="80" y="260" font-family="Arial" font-size="14" fill="#64748b">一个清晰的工作台。</text>
        <rect x="80" y="300" width="160" height="46" rx="12" fill="#2563eb"/><text x="118" y="328" font-family="Arial" font-size="14" font-weight="700" fill="#fff">开始使用</text>`;
      cards = [80, 320, 560].map((x) => `<rect x="${x}" y="370" width="220" height="120" rx="16" fill="#f8fafc"/><text x="${x + 24}" y="410" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能</text><text x="${x + 24}" y="450" font-family="Arial" font-size="12" fill="#64748b">说明</text>`).join('');
    }
  }
  return shell(nav + hero + cards);
}

/* ============ 布局模板 1：商品详情页 ============ */
function layout1(dimension, isGood) {
  const header = `<rect x="48" y="40" width="864" height="52" rx="12" fill="#fff"/><text x="80" y="72" font-family="Arial" font-size="15" font-weight="700" fill="#172033">Shop</text><text x="800" y="72" font-family="Arial" font-size="13" fill="#64748b">购物车</text>`;
  const productImg = `<rect x="48" y="120" width="380" height="380" rx="16" fill="#e2e8f0"/><circle cx="238" cy="310" r="60" fill="#cbd5e1"/>`;

  let info;
  if (dimension === 'contrast') {
    if (isGood) {
      info = `<text x="460" y="180" font-family="Arial" font-size="28" font-weight="700" fill="#172033">羊毛混纺大衣</text>
        <text x="460" y="240" font-family="Arial" font-size="32" font-weight="700" fill="#dc2626">¥1,280</text>
        <text x="460" y="280" font-family="Arial" font-size="14" fill="#64748b">原价 ¥1,580</text>
        <rect x="460" y="320" width="180" height="52" rx="12" fill="#2563eb"/><text x="500" y="352" font-family="Arial" font-size="15" font-weight="700" fill="#fff">加入购物车</text>`;
    } else {
      info = `<text x="460" y="180" font-family="Arial" font-size="20" fill="#475569">羊毛混纺大衣</text>
        <text x="460" y="230" font-family="Arial" font-size="20" fill="#475569">¥1,280</text>
        <text x="460" y="270" font-family="Arial" font-size="18" fill="#64748b">原价 ¥1,580</text>
        <rect x="460" y="310" width="180" height="52" rx="12" fill="#94a3b8"/><text x="500" y="342" font-family="Arial" font-size="15" fill="#fff">加入购物车</text>`;
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      info = `<text x="460" y="180" font-family="Arial" font-size="26" font-weight="700" fill="#172033">羊毛混纺大衣</text>
        <text x="460" y="220" font-family="Arial" font-size="22" font-weight="700" fill="#dc2626">¥1,280</text>
        <text x="460" y="260" font-family="Arial" font-size="14" fill="#64748b">原价 ¥1,580</text>
        <rect x="460" y="300" width="180" height="50" rx="12" fill="#2563eb"/><text x="500" y="330" font-family="Arial" font-size="14" font-weight="700" fill="#fff">加入购物车</text>
        <text x="460" y="400" font-family="Arial" font-size="14" fill="#64748b">尺码</text><rect x="460" y="420" width="60" height="36" rx="8" fill="#fff" stroke="#cbd5e1"/><rect x="530" y="420" width="60" height="36" rx="8" fill="#fff" stroke="#cbd5e1"/>`;
    } else {
      info = `<text x="490" y="180" font-family="Arial" font-size="26" font-weight="700" fill="#172033">羊毛混纺大衣</text>
        <text x="440" y="225" font-family="Arial" font-size="22" font-weight="700" fill="#dc2626">¥1,280</text>
        <text x="480" y="265" font-family="Arial" font-size="14" fill="#64748b">原价 ¥1,580</text>
        <rect x="500" y="310" width="180" height="50" rx="12" fill="#2563eb"/><text x="540" y="340" font-family="Arial" font-size="14" font-weight="700" fill="#fff">加入购物车</text>
        <text x="460" y="400" font-family="Arial" font-size="14" fill="#64748b">尺码</text><rect x="480" y="420" width="60" height="36" rx="8" fill="#fff" stroke="#cbd5e1"/><rect x="540" y="415" width="60" height="40" rx="8" fill="#fff" stroke="#cbd5e1"/>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      info = `<text x="460" y="180" font-family="Arial" font-size="26" font-weight="700" fill="#172033">羊毛混纺大衣</text>
        <text x="460" y="220" font-family="Arial" font-size="22" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="460" y="260" width="120" height="44" rx="12" fill="#2563eb"/><text x="486" y="288" font-family="Arial" font-size="13" font-weight="700" fill="#fff">加入购物车</text>
        <rect x="596" y="260" width="120" height="44" rx="12" fill="#fff" stroke="#cbd5e1"/><text x="622" y="288" font-family="Arial" font-size="13" fill="#334155">收藏</text>
        <rect x="460" y="330" width="120" height="44" rx="12" fill="#fff" stroke="#cbd5e1"/><text x="486" y="358" font-family="Arial" font-size="13" fill="#334155">找相似</text>`;
    } else {
      info = `<text x="460" y="180" font-family="Arial" font-size="26" font-weight="700" fill="#172033">羊毛混纺大衣</text>
        <text x="460" y="220" font-family="Arial" font-size="22" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="460" y="260" width="120" height="44" rx="4" fill="#2563eb"/><text x="486" y="288" font-family="Arial" font-size="13" font-weight="700" fill="#fff">加入购物车</text>
        <rect x="596" y="260" width="120" height="38" rx="20" fill="#fff" stroke="#f59e0b"/><text x="622" y="285" font-family="Arial" font-size="12" fill="#334155">收藏</text>
        <rect x="460" y="330" width="120" height="50" rx="0" fill="#f1f5f9"/><text x="486" y="360" font-family="Arial" font-size="14" fill="#334155">找相似</text>`;
    }
  } else {
    // proximity
    if (isGood) {
      info = `<text x="460" y="170" font-family="Arial" font-size="26" font-weight="700" fill="#172033">羊毛混纺大衣</text>
        <text x="460" y="194" font-family="Arial" font-size="13" fill="#64748b">2024 秋冬新款</text>
        <text x="460" y="250" font-family="Arial" font-size="22" font-weight="700" fill="#dc2626">¥1,280</text>
        <text x="460" y="272" font-family="Arial" font-size="12" fill="#64748b">原价 ¥1,580</text>
        <rect x="460" y="320" width="180" height="50" rx="12" fill="#2563eb"/><text x="500" y="350" font-family="Arial" font-size="14" font-weight="700" fill="#fff">加入购物车</text>`;
    } else {
      info = `<text x="460" y="170" font-family="Arial" font-size="26" font-weight="700" fill="#172033">羊毛混纺大衣</text>
        <text x="460" y="210" font-family="Arial" font-size="22" font-weight="700" fill="#dc2626">¥1,280</text>
        <text x="460" y="250" font-family="Arial" font-size="13" fill="#64748b">2024 秋冬新款</text>
        <text x="460" y="280" font-family="Arial" font-size="12" fill="#64748b">原价 ¥1,580</text>
        <rect x="460" y="320" width="180" height="50" rx="12" fill="#2563eb"/><text x="500" y="350" font-family="Arial" font-size="14" font-weight="700" fill="#fff">加入购物车</text>`;
    }
  }
  return shell(header + productImg + info);
}

/* ============ 布局模板 2：数据仪表盘 ============ */
function layout2(dimension, isGood) {
  const header = `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="76" font-family="Arial" font-size="18" font-weight="700" fill="#172033">数据概览</text><text x="800" y="76" font-family="Arial" font-size="13" fill="#64748b">本周</text>`;

  let kpis;
  let chart;
  if (dimension === 'contrast') {
    if (isGood) {
      kpis = [80, 290, 500, 710].map((x) => `<rect x="${x}" y="120" width="160" height="100" rx="14" fill="#fff"/><text x="${x + 20}" y="150" font-family="Arial" font-size="12" fill="#64748b">指标</text><text x="${x + 20}" y="190" font-family="Arial" font-size="28" font-weight="700" fill="#2563eb">8.2k</text>`).join('');
      chart = `<rect x="48" y="250" width="864" height="250" rx="14" fill="#fff"/><text x="72" y="284" font-family="Arial" font-size="14" font-weight="700" fill="#172033">趋势</text><polyline points="72,440 180,400 290,420 400,360 510,380 620,330 730,350 880,300" stroke="#2563eb" stroke-width="2.5" fill="none"/>`;
    } else {
      kpis = [80, 290, 500, 710].map((x) => `<rect x="${x}" y="120" width="160" height="100" rx="14" fill="#fff"/><text x="${x + 20}" y="150" font-family="Arial" font-size="14" fill="#64748b">指标</text><text x="${x + 20}" y="186" font-family="Arial" font-size="16" fill="#475569">8.2k</text>`).join('');
      chart = `<rect x="48" y="250" width="864" height="250" rx="14" fill="#fff"/><text x="72" y="284" font-family="Arial" font-size="14" font-weight="700" fill="#172033">趋势</text><polyline points="72,440 180,420 290,430 400,410 510,425 620,415 730,425 880,420" stroke="#94a3b8" stroke-width="1.5" fill="none"/>`;
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      kpis = [80, 290, 500, 710].map((x) => `<rect x="${x}" y="120" width="160" height="100" rx="14" fill="#fff"/><text x="${x + 20}" y="152" font-family="Arial" font-size="12" fill="#64748b">指标</text><text x="${x + 20}" y="188" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">8.2k</text>`).join('');
      chart = `<rect x="80" y="250" width="800" height="250" rx="14" fill="#fff"/><text x="104" y="284" font-family="Arial" font-size="14" font-weight="700" fill="#172033">趋势</text><polyline points="104,440 220,400 340,420 460,360 580,380 700,330 820,350" stroke="#2563eb" stroke-width="2" fill="none"/>`;
    } else {
      kpis = `<rect x="80" y="120" width="160" height="90" rx="14" fill="#fff"/><text x="100" y="150" font-family="Arial" font-size="12" fill="#64748b">指标</text><text x="100" y="182" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">8.2k</text>
        <rect x="300" y="110" width="160" height="110" rx="14" fill="#fff"/><text x="320" y="140" font-family="Arial" font-size="12" fill="#64748b">指标</text><text x="320" y="178" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">6.4k</text>
        <rect x="510" y="130" width="160" height="95" rx="14" fill="#fff"/><text x="530" y="160" font-family="Arial" font-size="12" fill="#64748b">指标</text><text x="530" y="194" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">5.1k</text>
        <rect x="720" y="118" width="160" height="100" rx="14" fill="#fff"/><text x="740" y="148" font-family="Arial" font-size="12" fill="#64748b">指标</text><text x="740" y="182" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">3.8k</text>`;
      chart = `<rect x="60" y="260" width="820" height="240" rx="14" fill="#fff"/><text x="90" y="294" font-family="Arial" font-size="14" font-weight="700" fill="#172033">趋势</text><polyline points="90,440 210,400 330,420 450,360 570,380 690,330 810,350" stroke="#2563eb" stroke-width="2" fill="none"/>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      kpis = [80, 290, 500, 710].map((x, i) => `<rect x="${x}" y="120" width="160" height="100" rx="14" fill="#fff" stroke="#e2e8f0"/><text x="${x + 20}" y="152" font-family="Arial" font-size="12" fill="#64748b">指标 ${i + 1}</text><text x="${x + 20}" y="188" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">${['8.2k', '6.4k', '5.1k', '3.8k'][i]}</text>`).join('');
    } else {
      kpis = `<rect x="80" y="120" width="160" height="100" rx="4" fill="#fff" stroke="#f59e0b"/><text x="100" y="152" font-family="Arial" font-size="12" fill="#64748b">指标一</text><text x="100" y="188" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">8.2k</text>
        <rect x="290" y="120" width="160" height="100" rx="20" fill="#fef3c7"/><text x="310" y="150" font-family="Arial" font-size="14" fill="#64748b">指标二</text><text x="310" y="190" font-family="Arial" font-size="20" fill="#172033">6.4k</text>
        <rect x="500" y="120" width="160" height="100" rx="0" fill="#f1f5f9"/><text x="520" y="156" font-family="Arial" font-size="10" fill="#64748b">指标三</text><text x="520" y="184" font-family="Arial" font-size="28" font-weight="700" fill="#dc2626">5.1k</text>
        <rect x="710" y="120" width="160" height="100" rx="14" fill="#fff" stroke="#e2e8f0"/><text x="730" y="152" font-family="Arial" font-size="12" fill="#64748b">指标四</text><text x="730" y="188" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">3.8k</text>`;
    }
    chart = `<rect x="48" y="250" width="864" height="250" rx="14" fill="#fff"/><text x="72" y="284" font-family="Arial" font-size="14" font-weight="700" fill="#172033">趋势</text><polyline points="72,440 180,400 290,420 400,360 510,380 620,330 730,350 880,300" stroke="#2563eb" stroke-width="2" fill="none"/>`;
  } else {
    // proximity
    if (isGood) {
      kpis = `<rect x="80" y="120" width="340" height="100" rx="14" fill="#fff"/><text x="100" y="152" font-family="Arial" font-size="12" fill="#64748b">收入指标</text><text x="100" y="188" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">8.2k</text>
        <rect x="540" y="120" width="340" height="100" rx="14" fill="#fff"/><text x="560" y="152" font-family="Arial" font-size="12" fill="#64748b">转化指标</text><text x="560" y="188" font-family="Arial" font-size="24" font-weight="700" fill="#2563eb">6.4k</text>`;
      chart = `<rect x="48" y="250" width="864" height="250" rx="14" fill="#fff"/><text x="72" y="284" font-family="Arial" font-size="14" font-weight="700" fill="#172033">趋势</text><polyline points="72,440 180,400 290,420 400,360 510,380 620,330 730,350 880,300" stroke="#2563eb" stroke-width="2" fill="none"/>`;
    } else {
      kpis = [80, 250, 420, 590, 760].map((x) => `<rect x="${x}" y="120" width="150" height="100" rx="14" fill="#fff"/><text x="${x + 16}" y="152" font-family="Arial" font-size="11" fill="#64748b">指标</text><text x="${x + 16}" y="188" font-family="Arial" font-size="22" font-weight="700" fill="#2563eb">8.2k</text>`).join('');
      chart = `<rect x="48" y="250" width="864" height="250" rx="14" fill="#fff"/><text x="72" y="284" font-family="Arial" font-size="14" font-weight="700" fill="#172033">趋势</text><polyline points="72,440 180,400 290,420 400,360 510,380 620,330 730,350 880,300" stroke="#2563eb" stroke-width="2" fill="none"/>`;
    }
  }
  return shell(header + kpis + chart);
}

/* ============ 布局模板 3：表单页（登录/注册） ============ */
function layout3(dimension, isGood) {
  let content;
  if (dimension === 'contrast') {
    if (isGood) {
      content = `<rect x="320" y="80" width="320" height="440" rx="20" fill="#fff"/>
        <text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700" fill="#172033">欢迎回来</text>
        <text x="480" y="170" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748b">登录你的账户</text>
        <rect x="360" y="210" width="240" height="44" rx="10" fill="#f1f5f9"/><text x="376" y="238" font-family="Arial" font-size="13" fill="#94a3b8">邮箱</text>
        <rect x="360" y="270" width="240" height="44" rx="10" fill="#f1f5f9"/><text x="376" y="298" font-family="Arial" font-size="13" fill="#94a3b8">密码</text>
        <rect x="360" y="340" width="240" height="50" rx="12" fill="#2563eb"/><text x="445" y="372" font-family="Arial" font-size="15" font-weight="700" fill="#fff">登录</text>
        <text x="480" y="430" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748b">还没有账户？注册</text>`;
    } else {
      content = `<rect x="320" y="80" width="320" height="440" rx="20" fill="#fff"/>
        <text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="20" fill="#475569">欢迎回来</text>
        <text x="480" y="168" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748b">登录你的账户</text>
        <rect x="360" y="210" width="240" height="44" rx="10" fill="#f1f5f9"/><text x="376" y="238" font-family="Arial" font-size="13" fill="#94a3b8">邮箱</text>
        <rect x="360" y="270" width="240" height="44" rx="10" fill="#f1f5f9"/><text x="376" y="298" font-family="Arial" font-size="13" fill="#94a3b8">密码</text>
        <rect x="360" y="340" width="240" height="50" rx="12" fill="#94a3b8"/><text x="445" y="372" font-family="Arial" font-size="15" fill="#fff">登录</text>
        <text x="480" y="430" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">还没有账户？注册</text>`;
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      content = `<rect x="320" y="80" width="320" height="440" rx="20" fill="#fff"/>
        <text x="360" y="140" font-family="Arial" font-size="24" font-weight="700" fill="#172033">欢迎回来</text>
        <text x="360" y="168" font-family="Arial" font-size="13" fill="#64748b">登录你的账户</text>
        <text x="360" y="216" font-family="Arial" font-size="12" fill="#64748b">邮箱</text><rect x="360" y="226" width="240" height="44" rx="10" fill="#f1f5f9"/>
        <text x="360" y="296" font-family="Arial" font-size="12" fill="#64748b">密码</text><rect x="360" y="306" width="240" height="44" rx="10" fill="#f1f5f9"/>
        <rect x="360" y="376" width="240" height="50" rx="12" fill="#2563eb"/><text x="445" y="408" font-family="Arial" font-size="15" font-weight="700" fill="#fff">登录</text>`;
    } else {
      content = `<rect x="320" y="80" width="320" height="440" rx="20" fill="#fff"/>
        <text x="380" y="140" font-family="Arial" font-size="24" font-weight="700" fill="#172033">欢迎回来</text>
        <text x="340" y="168" font-family="Arial" font-size="13" fill="#64748b">登录你的账户</text>
        <text x="350" y="216" font-family="Arial" font-size="12" fill="#64748b">邮箱</text><rect x="360" y="226" width="240" height="44" rx="10" fill="#f1f5f9"/>
        <text x="370" y="296" font-family="Arial" font-size="12" fill="#64748b">密码</text><rect x="380" y="306" width="240" height="44" rx="10" fill="#f1f5f9"/>
        <rect x="350" y="376" width="240" height="50" rx="12" fill="#2563eb"/><text x="435" y="408" font-family="Arial" font-size="15" font-weight="700" fill="#fff">登录</text>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      content = `<rect x="320" y="80" width="320" height="440" rx="20" fill="#fff"/>
        <text x="360" y="140" font-family="Arial" font-size="24" font-weight="700" fill="#172033">欢迎回来</text>
        <rect x="360" y="200" width="240" height="44" rx="10" fill="#f1f5f9"/><text x="376" y="228" font-family="Arial" font-size="13" fill="#94a3b8">邮箱</text>
        <rect x="360" y="260" width="240" height="44" rx="10" fill="#f1f5f9"/><text x="376" y="288" font-family="Arial" font-size="13" fill="#94a3b8">密码</text>
        <rect x="360" y="320" width="240" height="44" rx="10" fill="#f1f5f9"/><text x="376" y="348" font-family="Arial" font-size="13" fill="#94a3b8">验证码</text>
        <rect x="360" y="390" width="240" height="50" rx="12" fill="#2563eb"/><text x="445" y="422" font-family="Arial" font-size="15" font-weight="700" fill="#fff">登录</text>`;
    } else {
      content = `<rect x="320" y="80" width="320" height="440" rx="20" fill="#fff"/>
        <text x="360" y="140" font-family="Arial" font-size="24" font-weight="700" fill="#172033">欢迎回来</text>
        <rect x="360" y="200" width="240" height="44" rx="4" fill="#f1f5f9"/><text x="376" y="228" font-family="Arial" font-size="13" fill="#94a3b8">邮箱</text>
        <rect x="360" y="260" width="240" height="38" rx="20" fill="#fef3c7"/><text x="376" y="285" font-family="Arial" font-size="12" fill="#94a3b8">密码</text>
        <rect x="360" y="320" width="240" height="50" rx="0" fill="#f1f5f9"/><text x="376" y="350" font-family="Arial" font-size="14" fill="#94a3b8">验证码</text>
        <rect x="360" y="390" width="240" height="50" rx="12" fill="#2563eb"/><text x="445" y="422" font-family="Arial" font-size="15" font-weight="700" fill="#fff">登录</text>`;
    }
  } else {
    // proximity
    if (isGood) {
      content = `<rect x="320" y="80" width="320" height="440" rx="20" fill="#fff"/>
        <text x="360" y="132" font-family="Arial" font-size="24" font-weight="700" fill="#172033">欢迎回来</text>
        <text x="360" y="156" font-family="Arial" font-size="13" fill="#64748b">登录你的账户</text>
        <text x="360" y="206" font-family="Arial" font-size="12" fill="#64748b">邮箱</text><rect x="360" y="214" width="240" height="40" rx="8" fill="#f1f5f9"/>
        <text x="360" y="276" font-family="Arial" font-size="12" fill="#64748b">密码</text><rect x="360" y="284" width="240" height="40" rx="8" fill="#f1f5f9"/>
        <rect x="360" y="370" width="240" height="50" rx="12" fill="#2563eb"/><text x="445" y="402" font-family="Arial" font-size="15" font-weight="700" fill="#fff">登录</text>
        <text x="360" y="452" font-family="Arial" font-size="13" fill="#64748b">还没有账户？注册</text>`;
    } else {
      content = `<rect x="320" y="80" width="320" height="440" rx="20" fill="#fff"/>
        <text x="360" y="132" font-family="Arial" font-size="24" font-weight="700" fill="#172033">欢迎回来</text>
        <text x="360" y="200" font-family="Arial" font-size="13" fill="#64748b">登录你的账户</text>
        <text x="360" y="240" font-family="Arial" font-size="12" fill="#64748b">邮箱</text><rect x="360" y="280" width="240" height="40" rx="8" fill="#f1f5f9"/>
        <text x="360" y="340" font-family="Arial" font-size="12" fill="#64748b">密码</text><rect x="360" y="380" width="240" height="40" rx="8" fill="#f1f5f9"/>
        <rect x="360" y="440" width="240" height="50" rx="12" fill="#2563eb"/><text x="445" y="472" font-family="Arial" font-size="15" font-weight="700" fill="#fff">登录</text>
        <text x="360" y="520" font-family="Arial" font-size="13" fill="#64748b">还没有账户？注册</text>`;
    }
  }
  return shell(content);
}

/* ============ 布局模板 4：支付/预订页 ============ */
function layout4(dimension, isGood) {
  const header = `<rect x="48" y="40" width="864" height="52" rx="12" fill="#fff"/><text x="80" y="72" font-family="Arial" font-size="16" font-weight="700" fill="#172033">确认订单</text>`;

  let left;
  let right;
  if (dimension === 'contrast') {
    if (isGood) {
      left = `<rect x="48" y="120" width="500" height="380" rx="16" fill="#fff"/>
        <text x="72" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">收货地址</text>
        <rect x="72" y="180" width="452" height="60" rx="10" fill="#f8fafc"/><text x="92" y="208" font-family="Arial" font-size="13" fill="#172033">张三 138****8888</text><text x="92" y="228" font-family="Arial" font-size="12" fill="#64748b">北京市朝阳区</text>
        <text x="72" y="280" font-family="Arial" font-size="14" font-weight="700" fill="#172033">支付方式</text>
        <rect x="72" y="300" width="220" height="50" rx="10" fill="#eff6ff" stroke="#2563eb"/><text x="92" y="332" font-family="Arial" font-size="13" fill="#2563eb">支付宝</text>
        <rect x="304" y="300" width="220" height="50" rx="10" fill="#fff" stroke="#cbd5e1"/><text x="324" y="332" font-family="Arial" font-size="13" fill="#334155">微信支付</text>`;
      right = `<rect x="580" y="120" width="332" height="380" rx="16" fill="#fff"/>
        <text x="604" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">订单摘要</text>
        <text x="604" y="200" font-family="Arial" font-size="13" fill="#64748b">商品金额</text><text x="860" y="200" text-anchor="end" font-family="Arial" font-size="13" fill="#172033">¥1,280</text>
        <text x="604" y="240" font-family="Arial" font-size="13" fill="#64748b">运费</text><text x="860" y="240" text-anchor="end" font-family="Arial" font-size="13" fill="#172033">¥0</text>
        <line x1="604" y1="270" x2="888" y2="270" stroke="#e2e8f0"/>
        <text x="604" y="320" font-family="Arial" font-size="28" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="604" y="360" width="284" height="52" rx="12" fill="#2563eb"/><text x="700" y="392" font-family="Arial" font-size="15" font-weight="700" fill="#fff">提交订单</text>`;
    } else {
      left = `<rect x="48" y="120" width="500" height="380" rx="16" fill="#fff"/>
        <text x="72" y="156" font-family="Arial" font-size="14" fill="#475569">收货地址</text>
        <rect x="72" y="180" width="452" height="60" rx="10" fill="#f8fafc"/><text x="92" y="208" font-family="Arial" font-size="13" fill="#475569">张三 138****8888</text><text x="92" y="228" font-family="Arial" font-size="12" fill="#94a3b8">北京市朝阳区</text>
        <text x="72" y="280" font-family="Arial" font-size="14" fill="#475569">支付方式</text>
        <rect x="72" y="300" width="220" height="50" rx="10" fill="#f8fafc"/><text x="92" y="332" font-family="Arial" font-size="13" fill="#475569">支付宝</text>
        <rect x="304" y="300" width="220" height="50" rx="10" fill="#f8fafc"/><text x="324" y="332" font-family="Arial" font-size="13" fill="#475569">微信支付</text>`;
      right = `<rect x="580" y="120" width="332" height="380" rx="16" fill="#fff"/>
        <text x="604" y="156" font-family="Arial" font-size="14" fill="#475569">订单摘要</text>
        <text x="604" y="200" font-family="Arial" font-size="13" fill="#64748b">商品金额</text><text x="860" y="200" text-anchor="end" font-family="Arial" font-size="13" fill="#475569">¥1,280</text>
        <text x="604" y="240" font-family="Arial" font-size="13" fill="#64748b">运费</text><text x="860" y="240" text-anchor="end" font-family="Arial" font-size="13" fill="#475569">¥0</text>
        <line x1="604" y1="270" x2="888" y2="270" stroke="#e2e8f0"/>
        <text x="604" y="320" font-family="Arial" font-size="16" fill="#475569">¥1,280</text>
        <rect x="604" y="360" width="284" height="52" rx="12" fill="#94a3b8"/><text x="700" y="392" font-family="Arial" font-size="15" fill="#fff">提交订单</text>`;
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      left = `<rect x="48" y="120" width="500" height="380" rx="16" fill="#fff"/>
        <text x="72" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">收货地址</text>
        <rect x="72" y="180" width="452" height="60" rx="10" fill="#f8fafc"/>
        <text x="72" y="280" font-family="Arial" font-size="14" font-weight="700" fill="#172033">支付方式</text>
        <rect x="72" y="300" width="220" height="50" rx="10" fill="#eff6ff" stroke="#2563eb"/>
        <rect x="304" y="300" width="220" height="50" rx="10" fill="#fff" stroke="#cbd5e1"/>`;
      right = `<rect x="580" y="120" width="332" height="380" rx="16" fill="#fff"/>
        <text x="604" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">订单摘要</text>
        <line x1="604" y1="270" x2="888" y2="270" stroke="#e2e8f0"/>
        <text x="604" y="320" font-family="Arial" font-size="26" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="604" y="360" width="284" height="52" rx="12" fill="#2563eb"/>`;
    } else {
      left = `<rect x="48" y="120" width="500" height="380" rx="16" fill="#fff"/>
        <text x="80" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">收货地址</text>
        <rect x="60" y="180" width="452" height="60" rx="10" fill="#f8fafc"/>
        <text x="72" y="280" font-family="Arial" font-size="14" font-weight="700" fill="#172033">支付方式</text>
        <rect x="80" y="300" width="220" height="50" rx="10" fill="#eff6ff" stroke="#2563eb"/>
        <rect x="300" y="295" width="230" height="55" rx="10" fill="#fff" stroke="#cbd5e1"/>`;
      right = `<rect x="580" y="120" width="332" height="380" rx="16" fill="#fff"/>
        <text x="600" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">订单摘要</text>
        <line x1="620" y1="270" x2="880" y2="270" stroke="#e2e8f0"/>
        <text x="620" y="320" font-family="Arial" font-size="26" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="610" y="360" width="284" height="52" rx="12" fill="#2563eb"/>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      left = `<rect x="48" y="120" width="500" height="380" rx="16" fill="#fff"/>
        <text x="72" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">支付方式</text>
        <rect x="72" y="180" width="220" height="50" rx="10" fill="#eff6ff" stroke="#2563eb"/><text x="92" y="212" font-family="Arial" font-size="13" fill="#2563eb">支付宝</text>
        <rect x="304" y="180" width="220" height="50" rx="10" fill="#fff" stroke="#cbd5e1"/><text x="324" y="212" font-family="Arial" font-size="13" fill="#334155">微信</text>
        <rect x="72" y="250" width="220" height="50" rx="10" fill="#fff" stroke="#cbd5e1"/><text x="92" y="282" font-family="Arial" font-size="13" fill="#334155">银行卡</text>
        <rect x="304" y="250" width="220" height="50" rx="10" fill="#fff" stroke="#cbd5e1"/><text x="324" y="282" font-family="Arial" font-size="13" fill="#334155">信用卡</text>`;
      right = `<rect x="580" y="120" width="332" height="380" rx="16" fill="#fff"/>
        <text x="604" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">摘要</text>
        <text x="604" y="320" font-family="Arial" font-size="26" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="604" y="360" width="284" height="52" rx="12" fill="#2563eb"/>`;
    } else {
      left = `<rect x="48" y="120" width="500" height="380" rx="16" fill="#fff"/>
        <text x="72" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">支付方式</text>
        <rect x="72" y="180" width="220" height="50" rx="4" fill="#eff6ff" stroke="#2563eb"/><text x="92" y="212" font-family="Arial" font-size="13" fill="#2563eb">支付宝</text>
        <rect x="304" y="180" width="220" height="45" rx="20" fill="#fef3c7"/><text x="324" y="208" font-family="Arial" font-size="12" fill="#334155">微信</text>
        <rect x="72" y="250" width="220" height="55" rx="0" fill="#f1f5f9"/><text x="92" y="284" font-family="Arial" font-size="14" fill="#334155">银行卡</text>
        <rect x="304" y="250" width="220" height="50" rx="10" fill="#fff" stroke="#cbd5e1"/><text x="324" y="282" font-family="Arial" font-size="13" fill="#334155">信用卡</text>`;
      right = `<rect x="580" y="120" width="332" height="380" rx="16" fill="#fff"/>
        <text x="604" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">摘要</text>
        <text x="604" y="320" font-family="Arial" font-size="26" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="604" y="360" width="284" height="52" rx="12" fill="#2563eb"/>`;
    }
  } else {
    // proximity
    if (isGood) {
      left = `<rect x="48" y="120" width="500" height="180" rx="16" fill="#fff"/>
        <text x="72" y="152" font-family="Arial" font-size="14" font-weight="700" fill="#172033">收货地址</text>
        <text x="72" y="178" font-family="Arial" font-size="13" fill="#64748b">张三 138****8888</text>
        <text x="72" y="200" font-family="Arial" font-size="12" fill="#94a3b8">北京市朝阳区</text>
        <rect x="48" y="320" width="500" height="180" rx="16" fill="#fff"/>
        <text x="72" y="352" font-family="Arial" font-size="14" font-weight="700" fill="#172033">支付方式</text>
        <rect x="72" y="370" width="220" height="50" rx="10" fill="#eff6ff" stroke="#2563eb"/><text x="92" y="402" font-family="Arial" font-size="13" fill="#2563eb">支付宝</text>`;
      right = `<rect x="580" y="120" width="332" height="380" rx="16" fill="#fff"/>
        <text x="604" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">订单摘要</text>
        <text x="604" y="200" font-family="Arial" font-size="13" fill="#64748b">商品 ¥1,280</text>
        <text x="604" y="226" font-family="Arial" font-size="13" fill="#64748b">运费 ¥0</text>
        <line x1="604" y1="270" x2="888" y2="270" stroke="#e2e8f0"/>
        <text x="604" y="320" font-family="Arial" font-size="26" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="604" y="360" width="284" height="52" rx="12" fill="#2563eb"/>`;
    } else {
      left = `<rect x="48" y="120" width="500" height="380" rx="16" fill="#fff"/>
        <text x="72" y="152" font-family="Arial" font-size="14" font-weight="700" fill="#172033">收货地址</text>
        <text x="72" y="200" font-family="Arial" font-size="13" fill="#64748b">张三 138****8888</text>
        <text x="72" y="260" font-family="Arial" font-size="12" fill="#94a3b8">北京市朝阳区</text>
        <text x="72" y="320" font-family="Arial" font-size="14" font-weight="700" fill="#172033">支付方式</text>
        <rect x="72" y="370" width="220" height="50" rx="10" fill="#eff6ff" stroke="#2563eb"/>`;
      right = `<rect x="580" y="120" width="332" height="380" rx="16" fill="#fff"/>
        <text x="604" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">订单摘要</text>
        <text x="604" y="200" font-family="Arial" font-size="13" fill="#64748b">商品 ¥1,280</text>
        <text x="604" y="260" font-family="Arial" font-size="13" fill="#64748b">运费 ¥0</text>
        <line x1="604" y1="300" x2="888" y2="300" stroke="#e2e8f0"/>
        <text x="604" y="360" font-family="Arial" font-size="26" font-weight="700" fill="#dc2626">¥1,280</text>
        <rect x="604" y="420" width="284" height="52" rx="12" fill="#2563eb"/>`;
    }
  }
  return shell(header + left + right);
}

/* ============ 布局模板 5：活动落地页 ============ */
function layout5(dimension, isGood) {
  let content;
  if (dimension === 'contrast') {
    if (isGood) {
      content = `<rect x="48" y="40" width="864" height="520" rx="20" fill="#1e293b"/>
        <text x="480" y="160" text-anchor="middle" font-family="Arial" font-size="48" font-weight="700" fill="#fff">双 11 狂欢</text>
        <text x="480" y="210" text-anchor="middle" font-family="Arial" font-size="20" fill="#94a3b8">全场最低 5 折</text>
        <text x="480" y="300" text-anchor="middle" font-family="Arial" font-size="64" font-weight="700" fill="#f59e0b">02:14:33</text>
        <rect x="380" y="360" width="200" height="56" rx="14" fill="#f59e0b"/><text x="430" y="394" font-family="Arial" font-size="17" font-weight="700" fill="#1e293b">立即抢购</text>`;
    } else {
      content = `<rect x="48" y="40" width="864" height="520" rx="20" fill="#1e293b"/>
        <text x="480" y="160" text-anchor="middle" font-family="Arial" font-size="24" fill="#cbd5e1">双 11 狂欢</text>
        <text x="480" y="200" text-anchor="middle" font-family="Arial" font-size="22" fill="#94a3b8">全场最低 5 折</text>
        <text x="480" y="280" text-anchor="middle" font-family="Arial" font-size="24" fill="#cbd5e1">02:14:33</text>
        <rect x="380" y="340" width="200" height="56" rx="14" fill="#475569"/><text x="430" y="374" font-family="Arial" font-size="17" fill="#cbd5e1">立即抢购</text>`;
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      content = `<rect x="48" y="40" width="864" height="520" rx="20" fill="#1e293b"/>
        <text x="480" y="160" text-anchor="middle" font-family="Arial" font-size="44" font-weight="700" fill="#fff">双 11 狂欢</text>
        <text x="480" y="200" text-anchor="middle" font-family="Arial" font-size="18" fill="#94a3b8">全场最低 5 折</text>
        <text x="480" y="290" text-anchor="middle" font-family="Arial" font-size="56" font-weight="700" fill="#f59e0b">02:14:33</text>
        <rect x="380" y="350" width="200" height="56" rx="14" fill="#f59e0b"/>`;
    } else {
      content = `<rect x="48" y="40" width="864" height="520" rx="20" fill="#1e293b"/>
        <text x="500" y="160" text-anchor="middle" font-family="Arial" font-size="44" font-weight="700" fill="#fff">双 11 狂欢</text>
        <text x="460" y="200" text-anchor="middle" font-family="Arial" font-size="18" fill="#94a3b8">全场最低 5 折</text>
        <text x="490" y="290" text-anchor="middle" font-family="Arial" font-size="56" font-weight="700" fill="#f59e0b">02:14:33</text>
        <rect x="370" y="350" width="200" height="56" rx="14" fill="#f59e0b"/>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      const guests = [180, 380, 580].map((x) => `<circle cx="${x}" cy="430" r="28" fill="#f59e0b"/><text x="${x}" y="438" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#1e293b">嘉宾</text>`).join('');
      content = `<rect x="48" y="40" width="864" height="520" rx="20" fill="#1e293b"/>
        <text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" fill="#fff">双 11 狂欢</text>
        <text x="480" y="230" text-anchor="middle" font-family="Arial" font-size="48" font-weight="700" fill="#f59e0b">02:14:33</text>
        <rect x="380" y="290" width="200" height="52" rx="14" fill="#f59e0b"/>${guests}`;
    } else {
      const guests = `<circle cx="180" cy="430" r="28" fill="#f59e0b"/><text x="180" y="438" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#1e293b">嘉宾</text>
        <rect x="350" y="410" width="60" height="40" rx="6" fill="#475569"/><text x="380" y="436" text-anchor="middle" font-family="Arial" font-size="12" fill="#cbd5e1">嘉宾</text>
        <circle cx="580" cy="430" r="20" fill="#94a3b8"/><text x="580" y="436" text-anchor="middle" font-family="Arial" font-size="10" fill="#1e293b">嘉宾</text>`;
      content = `<rect x="48" y="40" width="864" height="520" rx="20" fill="#1e293b"/>
        <text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" fill="#fff">双 11 狂欢</text>
        <text x="480" y="230" text-anchor="middle" font-family="Arial" font-size="48" font-weight="700" fill="#f59e0b">02:14:33</text>
        <rect x="380" y="290" width="200" height="52" rx="14" fill="#f59e0b"/>${guests}`;
    }
  } else {
    // proximity
    if (isGood) {
      content = `<rect x="48" y="40" width="864" height="520" rx="20" fill="#1e293b"/>
        <text x="480" y="120" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" fill="#fff">双 11 狂欢</text>
        <text x="480" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#94a3b8">全场最低 5 折</text>
        <text x="480" y="240" text-anchor="middle" font-family="Arial" font-size="14" fill="#cbd5e1">距活动结束</text>
        <text x="480" y="290" text-anchor="middle" font-family="Arial" font-size="48" font-weight="700" fill="#f59e0b">02:14:33</text>
        <rect x="380" y="360" width="200" height="52" rx="14" fill="#f59e0b"/>
        <text x="480" y="450" text-anchor="middle" font-family="Arial" font-size="14" fill="#94a3b8">特邀嘉宾</text>
        <circle cx="430" cy="486" r="16" fill="#f59e0b"/><circle cx="480" cy="486" r="16" fill="#f59e0b"/><circle cx="530" cy="486" r="16" fill="#f59e0b"/>`;
    } else {
      content = `<rect x="48" y="40" width="864" height="520" rx="20" fill="#1e293b"/>
        <text x="480" y="120" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" fill="#fff">双 11 狂欢</text>
        <text x="480" y="160" text-anchor="middle" font-family="Arial" font-size="16" fill="#94a3b8">全场最低 5 折</text>
        <text x="480" y="210" text-anchor="middle" font-family="Arial" font-size="14" fill="#cbd5e1">距活动结束</text>
        <text x="480" y="260" text-anchor="middle" font-family="Arial" font-size="48" font-weight="700" fill="#f59e0b">02:14:33</text>
        <rect x="380" y="310" width="200" height="52" rx="14" fill="#f59e0b"/>
        <text x="480" y="420" text-anchor="middle" font-family="Arial" font-size="14" fill="#94a3b8">特邀嘉宾</text>
        <circle cx="430" cy="486" r="16" fill="#f59e0b"/><circle cx="480" cy="486" r="16" fill="#f59e0b"/><circle cx="530" cy="486" r="16" fill="#f59e0b"/>`;
    }
  }
  return shell(content);
}

/* ============ 布局模板 6：移动端界面 ============ */
function layout6(dimension, isGood) {
  const phone = (content) => `<rect x="340" y="60" width="280" height="500" rx="32" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="340" y="60" width="280" height="40" rx="32" fill="#f1f5f9"/>
    <text x="480" y="86" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">9:41</text>${content}`;

  let content;
  if (dimension === 'contrast') {
    if (isGood) {
      content = `<text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#172033">我的</text>
        <rect x="360" y="170" width="240" height="80" rx="14" fill="#eff6ff"/>
        <text x="480" y="280" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#2563eb">¥2,580</text>
        <rect x="360" y="320" width="240" height="50" rx="12" fill="#2563eb"/><text x="480" y="352" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#fff">充值</text>
        <rect x="360" y="390" width="240" height="50" rx="12" fill="#fff" stroke="#cbd5e1"/><text x="480" y="422" text-anchor="middle" font-family="Arial" font-size="14" fill="#334155">提现</text>`;
    } else {
      content = `<text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="18" fill="#475569">我的</text>
        <rect x="360" y="170" width="240" height="80" rx="14" fill="#f1f5f9"/>
        <text x="480" y="280" text-anchor="middle" font-family="Arial" font-size="20" fill="#475569">¥2,580</text>
        <rect x="360" y="320" width="240" height="50" rx="12" fill="#94a3b8"/><text x="480" y="352" text-anchor="middle" font-family="Arial" font-size="14" fill="#fff">充值</text>
        <rect x="360" y="390" width="240" height="50" rx="12" fill="#94a3b8"/><text x="480" y="422" text-anchor="middle" font-family="Arial" font-size="14" fill="#fff">提现</text>`;
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      const icons = [380, 440, 500, 560].map((x) => `<rect x="${x - 22}" y="200" width="44" height="44" rx="12" fill="#eff6ff"/>`).join('');
      content = `<text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#172033">我的</text>${icons}
        <text x="380" y="270" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="440" y="270" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="500" y="270" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="560" y="270" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <rect x="360" y="320" width="240" height="100" rx="14" fill="#f8fafc"/>`;
    } else {
      content = `<text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#172033">我的</text>
        <rect x="370" y="195" width="44" height="44" rx="12" fill="#eff6ff"/>
        <rect x="430" y="210" width="40" height="40" rx="12" fill="#eff6ff"/>
        <rect x="495" y="200" width="46" height="46" rx="12" fill="#eff6ff"/>
        <rect x="560" y="190" width="42" height="42" rx="12" fill="#eff6ff"/>
        <text x="392" y="270" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="450" y="278" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="518" y="270" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="581" y="265" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <rect x="360" y="320" width="240" height="100" rx="14" fill="#f8fafc"/>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      const tabs = [380, 440, 500, 560].map((x) => `<rect x="${x - 18}" y="180" width="36" height="36" rx="10" fill="#eff6ff"/>`).join('');
      content = `<text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#172033">我的</text>${tabs}
        <text x="380" y="240" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="440" y="240" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="500" y="240" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="560" y="240" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <rect x="360" y="290" width="240" height="60" rx="12" fill="#fff" stroke="#cbd5e1"/>
        <rect x="360" y="370" width="240" height="60" rx="12" fill="#fff" stroke="#cbd5e1"/>`;
    } else {
      content = `<text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#172033">我的</text>
        <rect x="362" y="180" width="36" height="36" rx="4" fill="#fef3c7"/>
        <rect x="422" y="180" width="36" height="36" rx="18" fill="#eff6ff"/>
        <rect x="482" y="180" width="36" height="36" rx="0" fill="#f1f5f9"/>
        <rect x="542" y="180" width="36" height="36" rx="10" fill="#fff" stroke="#f59e0b"/>
        <text x="380" y="240" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">功能</text>
        <text x="440" y="240" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748b">功能</text>
        <text x="500" y="240" text-anchor="middle" font-family="Arial" font-size="10" fill="#64748b">功能</text>
        <text x="560" y="240" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">功能</text>
        <rect x="360" y="290" width="240" height="60" rx="4" fill="#fff" stroke="#f59e0b"/>
        <rect x="360" y="370" width="240" height="60" rx="20" fill="#fef3c7"/>`;
    }
  } else {
    // proximity
    if (isGood) {
      content = `<text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#172033">我的</text>
        <rect x="360" y="170" width="240" height="70" rx="14" fill="#eff6ff"/>
        <text x="480" y="200" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748b">账户余额</text>
        <text x="480" y="225" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#2563eb">¥2,580</text>
        <rect x="360" y="270" width="240" height="100" rx="14" fill="#f8fafc"/>
        <text x="380" y="300" font-family="Arial" font-size="13" fill="#172033">我的订单</text>
        <text x="380" y="324" font-family="Arial" font-size="11" fill="#64748b">查看全部</text>
        <rect x="360" y="400" width="240" height="60" rx="14" fill="#fff" stroke="#cbd5e1"/>`;
    } else {
      content = `<text x="480" y="140" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#172033">我的</text>
        <rect x="360" y="170" width="240" height="70" rx="14" fill="#eff6ff"/>
        <text x="480" y="195" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748b">账户余额</text>
        <text x="480" y="225" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#2563eb">¥2,580</text>
        <rect x="360" y="270" width="240" height="60" rx="14" fill="#f8fafc"/>
        <text x="380" y="300" font-family="Arial" font-size="13" fill="#172033">我的订单</text>
        <rect x="360" y="350" width="240" height="60" rx="14" fill="#fff" stroke="#cbd5e1"/>
        <text x="380" y="380" font-family="Arial" font-size="11" fill="#64748b">查看全部</text>
        <rect x="360" y="430" width="240" height="60" rx="14" fill="#fff" stroke="#cbd5e1"/>`;
    }
  }
  return shell(phone(content));
}

/* ============ 布局模板 7：内容详情页 ============ */
function layout7(dimension, isGood) {
  const header = `<rect x="48" y="40" width="864" height="52" rx="12" fill="#fff"/><text x="80" y="72" font-family="Arial" font-size="15" font-weight="700" fill="#172033">文章</text>`;

  let main;
  let side;
  if (dimension === 'contrast') {
    if (isGood) {
      main = `<rect x="48" y="120" width="560" height="440" rx="16" fill="#fff"/>
        <text x="72" y="160" font-family="Arial" font-size="24" font-weight="700" fill="#172033">深度解析：设计系统的构建路径</text>
        <text x="72" y="190" font-family="Arial" font-size="13" fill="#64748b">作者 · 2024-07-14</text>
        <text x="72" y="240" font-family="Arial" font-size="15" fill="#334155">正文内容使用适中的字号和行距，</text>
        <text x="72" y="266" font-family="Arial" font-size="15" fill="#334155">让阅读体验舒适而专注。</text>
        <rect x="72" y="400" width="140" height="44" rx="10" fill="#2563eb"/><text x="102" y="428" font-family="Arial" font-size="13" font-weight="700" fill="#fff">订阅</text>`;
      side = `<rect x="640" y="120" width="272" height="440" rx="16" fill="#f8fafc"/>
        <text x="664" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">相关推荐</text>
        <rect x="664" y="180" width="224" height="60" rx="10" fill="#fff"/><rect x="664" y="256" width="224" height="60" rx="10" fill="#fff"/>`;
    } else {
      main = `<rect x="48" y="120" width="560" height="440" rx="16" fill="#fff"/>
        <text x="72" y="160" font-family="Arial" font-size="18" fill="#475569">深度解析：设计系统的构建路径</text>
        <text x="72" y="188" font-family="Arial" font-size="16" fill="#64748b">作者 · 2024-07-14</text>
        <text x="72" y="236" font-family="Arial" font-size="16" fill="#64748b">正文内容使用适中的字号和行距，</text>
        <text x="72" y="262" font-family="Arial" font-size="16" fill="#64748b">让阅读体验舒适而专注。</text>
        <rect x="72" y="400" width="140" height="44" rx="10" fill="#94a3b8"/><text x="102" y="428" font-family="Arial" font-size="13" fill="#fff">订阅</text>`;
      side = `<rect x="640" y="120" width="272" height="440" rx="16" fill="#f1f5f9"/>
        <text x="664" y="156" font-family="Arial" font-size="16" fill="#64748b">相关推荐</text>
        <rect x="664" y="180" width="224" height="60" rx="10" fill="#fff"/><rect x="664" y="256" width="224" height="60" rx="10" fill="#fff"/>`;
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      main = `<rect x="48" y="120" width="560" height="440" rx="16" fill="#fff"/>
        <text x="72" y="160" font-family="Arial" font-size="24" font-weight="700" fill="#172033">深度解析</text>
        <text x="72" y="190" font-family="Arial" font-size="13" fill="#64748b">作者 · 2024-07-14</text>
        <text x="72" y="240" font-family="Arial" font-size="15" fill="#334155">正文内容。</text>
        <rect x="72" y="400" width="140" height="44" rx="10" fill="#2563eb"/>`;
      side = `<rect x="640" y="120" width="272" height="440" rx="16" fill="#f8fafc"/>
        <text x="664" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">推荐</text>
        <rect x="664" y="180" width="224" height="60" rx="10" fill="#fff"/>
        <rect x="664" y="256" width="224" height="60" rx="10" fill="#fff"/>`;
    } else {
      main = `<rect x="48" y="120" width="560" height="440" rx="16" fill="#fff"/>
        <text x="80" y="160" font-family="Arial" font-size="24" font-weight="700" fill="#172033">深度解析</text>
        <text x="60" y="190" font-family="Arial" font-size="13" fill="#64748b">作者 · 2024-07-14</text>
        <text x="90" y="240" font-family="Arial" font-size="15" fill="#334155">正文内容。</text>
        <rect x="64" y="400" width="140" height="44" rx="10" fill="#2563eb"/>`;
      side = `<rect x="640" y="120" width="272" height="440" rx="16" fill="#f8fafc"/>
        <text x="680" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">推荐</text>
        <rect x="660" y="180" width="224" height="60" rx="10" fill="#fff"/>
        <rect x="664" y="260" width="220" height="56" rx="10" fill="#fff"/>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      main = `<rect x="48" y="120" width="560" height="440" rx="16" fill="#fff"/>
        <text x="72" y="160" font-family="Arial" font-size="24" font-weight="700" fill="#172033">深度解析</text>
        <text x="72" y="240" font-family="Arial" font-size="15" fill="#334155">正文段落一</text>
        <text x="72" y="270" font-family="Arial" font-size="15" fill="#334155">正文段落二</text>
        <text x="72" y="300" font-family="Arial" font-size="15" fill="#334155">正文段落三</text>`;
      side = `<rect x="640" y="120" width="272" height="140" rx="16" fill="#fff" stroke="#e2e8f0"/>
        <rect x="640" y="280" width="272" height="140" rx="16" fill="#fff" stroke="#e2e8f0"/>
        <rect x="640" y="440" width="272" height="120" rx="16" fill="#fff" stroke="#e2e8f0"/>`;
    } else {
      main = `<rect x="48" y="120" width="560" height="440" rx="16" fill="#fff"/>
        <text x="72" y="160" font-family="Arial" font-size="24" font-weight="700" fill="#172033">深度解析</text>
        <text x="72" y="240" font-family="Arial" font-size="15" fill="#334155">正文段落一</text>
        <text x="72" y="275" font-family="Arial" font-size="13" fill="#334155">正文段落二</text>
        <text x="72" y="305" font-family="Arial" font-size="17" fill="#334155">正文段落三</text>`;
      side = `<rect x="640" y="120" width="272" height="140" rx="4" fill="#fff" stroke="#f59e0b"/>
        <rect x="640" y="280" width="272" height="140" rx="20" fill="#fef3c7"/>
        <rect x="640" y="440" width="272" height="120" rx="0" fill="#f1f5f9"/>`;
    }
  } else {
    // proximity
    if (isGood) {
      main = `<rect x="48" y="120" width="560" height="440" rx="16" fill="#fff"/>
        <text x="72" y="156" font-family="Arial" font-size="24" font-weight="700" fill="#172033">深度解析</text>
        <text x="72" y="180" font-family="Arial" font-size="13" fill="#64748b">作者 · 2024-07-14</text>
        <text x="72" y="240" font-family="Arial" font-size="15" fill="#334155">正文段落一。</text>
        <text x="72" y="266" font-family="Arial" font-size="15" fill="#334155">正文段落二。</text>
        <text x="72" y="340" font-family="Arial" font-size="13" fill="#64748b">标签</text>
        <rect x="72" y="356" width="60" height="28" rx="14" fill="#eff6ff"/><rect x="140" y="356" width="60" height="28" rx="14" fill="#eff6ff"/>`;
      side = `<rect x="640" y="120" width="272" height="440" rx="16" fill="#f8fafc"/>
        <text x="664" y="156" font-family="Arial" font-size="14" font-weight="700" fill="#172033">推荐</text>
        <rect x="664" y="180" width="224" height="60" rx="10" fill="#fff"/>`;
    } else {
      main = `<rect x="48" y="120" width="560" height="440" rx="16" fill="#fff"/>
        <text x="72" y="156" font-family="Arial" font-size="24" font-weight="700" fill="#172033">深度解析</text>
        <text x="72" y="220" font-family="Arial" font-size="13" fill="#64748b">作者 · 2024-07-14</text>
        <text x="72" y="260" font-family="Arial" font-size="15" fill="#334155">正文段落一。</text>
        <text x="72" y="300" font-family="Arial" font-size="15" fill="#334155">正文段落二。</text>
        <text x="72" y="360" font-family="Arial" font-size="13" fill="#64748b">标签</text>
        <rect x="72" y="380" width="60" height="28" rx="14" fill="#eff6ff"/><rect x="140" y="380" width="60" height="28" rx="14" fill="#eff6ff"/>`;
      side = `<rect x="640" y="120" width="272" height="440" rx="16" fill="#f8fafc"/>
        <text x="664" y="180" font-family="Arial" font-size="14" font-weight="700" fill="#172033">推荐</text>
        <rect x="664" y="220" width="224" height="60" rx="10" fill="#fff"/>`;
    }
  }
  return shell(header + main + side);
}

/* ============ 布局模板 8：列表/招聘页 ============ */
function layout8(dimension, isGood) {
  const header = `<rect x="48" y="40" width="864" height="52" rx="12" fill="#fff"/><text x="80" y="72" font-family="Arial" font-size="16" font-weight="700" fill="#172033">职位列表</text>`;
  const filter = `<rect x="48" y="120" width="864" height="56" rx="12" fill="#fff"/><rect x="72" y="132" width="100" height="32" rx="8" fill="#eff6ff"/><text x="100" y="154" font-family="Arial" font-size="12" fill="#2563eb">全部</text><rect x="184" y="132" width="100" height="32" rx="8" fill="#f1f5f9"/><text x="212" y="154" font-family="Arial" font-size="12" fill="#64748b">技术</text>`;

  let items;
  if (dimension === 'contrast') {
    if (isGood) {
      items = [200, 310, 420].map((y) => `<rect x="48" y="${y}" width="864" height="90" rx="14" fill="#fff"/>
        <text x="72" y="${y + 32}" font-family="Arial" font-size="18" font-weight="700" fill="#172033">高级前端工程师</text>
        <text x="72" y="${y + 60}" font-family="Arial" font-size="13" fill="#64748b">北京 · 3-5 年</text>
        <text x="880" y="${y + 36}" text-anchor="end" font-family="Arial" font-size="20" font-weight="700" fill="#dc2626">25-40k</text>
        <rect x="760" y="${y + 50}" width="120" height="32" rx="8" fill="#2563eb"/><text x="790" y="${y + 72}" font-family="Arial" font-size="12" font-weight="700" fill="#fff">投递</text>`).join('');
    } else {
      items = [200, 310, 420].map((y) => `<rect x="48" y="${y}" width="864" height="90" rx="14" fill="#fff"/>
        <text x="72" y="${y + 32}" font-family="Arial" font-size="16" fill="#475569">高级前端工程师</text>
        <text x="72" y="${y + 60}" font-family="Arial" font-size="14" fill="#64748b">北京 · 3-5 年</text>
        <text x="880" y="${y + 36}" text-anchor="end" font-family="Arial" font-size="16" fill="#475569">25-40k</text>
        <rect x="760" y="${y + 50}" width="120" height="32" rx="8" fill="#94a3b8"/><text x="790" y="${y + 72}" font-family="Arial" font-size="12" fill="#fff">投递</text>`).join('');
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      items = [200, 310, 420].map((y) => `<rect x="48" y="${y}" width="864" height="90" rx="14" fill="#fff"/>
        <text x="72" y="${y + 32}" font-family="Arial" font-size="17" font-weight="700" fill="#172033">高级前端工程师</text>
        <text x="72" y="${y + 60}" font-family="Arial" font-size="13" fill="#64748b">北京 · 3-5 年</text>
        <text x="680" y="${y + 32}" font-family="Arial" font-size="13" fill="#64748b">薪资</text>
        <text x="680" y="${y + 60}" font-family="Arial" font-size="17" font-weight="700" fill="#dc2626">25-40k</text>`).join('');
    } else {
      items = `<rect x="48" y="200" width="864" height="90" rx="14" fill="#fff"/>
        <text x="72" y="232" font-family="Arial" font-size="17" font-weight="700" fill="#172033">高级前端工程师</text>
        <text x="72" y="260" font-family="Arial" font-size="13" fill="#64748b">北京 · 3-5 年</text>
        <text x="690" y="232" font-family="Arial" font-size="13" fill="#64748b">薪资</text>
        <text x="680" y="262" font-family="Arial" font-size="17" font-weight="700" fill="#dc2626">25-40k</text>
        <rect x="48" y="310" width="864" height="80" rx="14" fill="#fff"/>
        <text x="80" y="342" font-family="Arial" font-size="17" font-weight="700" fill="#172033">产品经理</text>
        <text x="80" y="368" font-family="Arial" font-size="13" fill="#64748b">上海 · 5-7 年</text>
        <text x="700" y="342" font-family="Arial" font-size="13" fill="#64748b">薪资</text>
        <text x="690" y="370" font-family="Arial" font-size="17" font-weight="700" fill="#dc2626">20-35k</text>
        <rect x="48" y="410" width="864" height="100" rx="14" fill="#fff"/>
        <text x="60" y="442" font-family="Arial" font-size="17" font-weight="700" fill="#172033">UI 设计师</text>
        <text x="60" y="472" font-family="Arial" font-size="13" fill="#64748b">深圳 · 3-5 年</text>
        <text x="710" y="442" font-family="Arial" font-size="13" fill="#64748b">薪资</text>
        <text x="700" y="472" font-family="Arial" font-size="17" font-weight="700" fill="#dc2626">18-30k</text>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      items = [200, 310, 420].map((y) => `<rect x="48" y="${y}" width="864" height="90" rx="14" fill="#fff" stroke="#e2e8f0"/>
        <text x="72" y="${y + 32}" font-family="Arial" font-size="17" font-weight="700" fill="#172033">高级前端工程师</text>
        <text x="72" y="${y + 60}" font-family="Arial" font-size="13" fill="#64748b">北京 · 3-5 年</text>
        <rect x="760" y="${y + 28}" width="120" height="36" rx="10" fill="#2563eb"/><text x="790" y="${y + 52}" font-family="Arial" font-size="13" font-weight="700" fill="#fff">投递</text>`).join('');
    } else {
      items = `<rect x="48" y="200" width="864" height="90" rx="4" fill="#fff" stroke="#f59e0b"/>
        <text x="72" y="232" font-family="Arial" font-size="17" font-weight="700" fill="#172033">高级前端工程师</text>
        <rect x="760" y="228" width="120" height="36" rx="4" fill="#2563eb"/><text x="790" y="252" font-family="Arial" font-size="13" font-weight="700" fill="#fff">投递</text>
        <rect x="48" y="310" width="864" height="90" rx="20" fill="#fef3c7"/>
        <text x="72" y="342" font-family="Arial" font-size="22" font-weight="700" fill="#172033">产品经理</text>
        <rect x="760" y="338" width="120" height="32" rx="20" fill="#94a3b8"/><text x="790" y="360" font-family="Arial" font-size="12" fill="#fff">投递</text>
        <rect x="48" y="420" width="864" height="90" rx="0" fill="#f1f5f9"/>
        <text x="72" y="452" font-family="Arial" font-size="14" font-weight="700" fill="#172033">UI 设计师</text>
        <rect x="760" y="440" width="120" height="40" rx="0" fill="#2563eb"/><text x="790" y="466" font-family="Arial" font-size="14" fill="#fff">投递</text>`;
    }
  } else {
    // proximity
    if (isGood) {
      items = [200, 330, 460].map((y) => `<rect x="48" y="${y}" width="864" height="110" rx="14" fill="#fff"/>
        <text x="72" y="${y + 30}" font-family="Arial" font-size="17" font-weight="700" fill="#172033">高级前端工程师</text>
        <text x="72" y="${y + 54}" font-family="Arial" font-size="13" fill="#64748b">北京 · 3-5 年 · 本科</text>
        <text x="72" y="${y + 80}" font-family="Arial" font-size="12" fill="#94a3b8">React · TypeScript · Node.js</text>`).join('');
    } else {
      items = [200, 280, 360, 440].map((y) => `<rect x="48" y="${y}" width="864" height="70" rx="14" fill="#fff"/>
        <text x="72" y="${y + 28}" font-family="Arial" font-size="17" font-weight="700" fill="#172033">高级前端工程师</text>
        <text x="72" y="${y + 52}" font-family="Arial" font-size="13" fill="#64748b">北京 · 3-5 年 · 本科 · React · TypeScript</text>`).join('');
    }
  }
  return shell(header + filter + items);
}

/* ============ 布局模板 9：个人/设置页 ============ */
function layout9(dimension, isGood) {
  let nav;
  let content;
  if (dimension === 'contrast') {
    if (isGood) {
      nav = `<rect x="48" y="40" width="220" height="520" rx="16" fill="#fff"/>
        <text x="72" y="76" font-family="Arial" font-size="14" font-weight="700" fill="#172033">设置</text>
        <rect x="60" y="96" width="196" height="44" rx="10" fill="#eff6ff"/><text x="80" y="124" font-family="Arial" font-size="13" font-weight="700" fill="#2563eb">账户</text>
        <text x="80" y="172" font-family="Arial" font-size="13" fill="#64748b">通知</text>
        <text x="80" y="208" font-family="Arial" font-size="13" fill="#64748b">隐私</text>`;
      content = `<rect x="296" y="40" width="616" height="520" rx="16" fill="#fff"/>
        <text x="324" y="84" font-family="Arial" font-size="22" font-weight="700" fill="#172033">账户信息</text>
        <text x="324" y="140" font-family="Arial" font-size="13" fill="#64748b">姓名</text><rect x="324" y="152" width="560" height="44" rx="10" fill="#f1f5f9"/>
        <text x="324" y="230" font-family="Arial" font-size="13" fill="#64748b">邮箱</text><rect x="324" y="242" width="560" height="44" rx="10" fill="#f1f5f9"/>
        <rect x="324" y="330" width="160" height="50" rx="12" fill="#2563eb"/><text x="364" y="362" font-family="Arial" font-size="14" font-weight="700" fill="#fff">保存</text>`;
    } else {
      nav = `<rect x="48" y="40" width="220" height="520" rx="16" fill="#fff"/>
        <text x="72" y="76" font-family="Arial" font-size="14" fill="#475569">设置</text>
        <rect x="60" y="96" width="196" height="44" rx="10" fill="#f1f5f9"/><text x="80" y="124" font-family="Arial" font-size="13" fill="#475569">账户</text>
        <text x="80" y="172" font-family="Arial" font-size="13" fill="#94a3b8">通知</text>
        <text x="80" y="208" font-family="Arial" font-size="13" fill="#94a3b8">隐私</text>`;
      content = `<rect x="296" y="40" width="616" height="520" rx="16" fill="#fff"/>
        <text x="324" y="84" font-family="Arial" font-size="18" fill="#475569">账户信息</text>
        <text x="324" y="140" font-family="Arial" font-size="14" fill="#64748b">姓名</text><rect x="324" y="152" width="560" height="44" rx="10" fill="#f1f5f9"/>
        <text x="324" y="230" font-family="Arial" font-size="14" fill="#64748b">邮箱</text><rect x="324" y="242" width="560" height="44" rx="10" fill="#f1f5f9"/>
        <rect x="324" y="330" width="160" height="50" rx="12" fill="#94a3b8"/><text x="364" y="362" font-family="Arial" font-size="14" fill="#fff">保存</text>`;
    }
  } else if (dimension === 'alignment') {
    if (isGood) {
      nav = `<rect x="48" y="40" width="220" height="520" rx="16" fill="#fff"/>
        <text x="72" y="76" font-family="Arial" font-size="14" font-weight="700" fill="#172033">设置</text>
        <rect x="60" y="96" width="196" height="44" rx="10" fill="#eff6ff"/><text x="80" y="124" font-family="Arial" font-size="13" font-weight="700" fill="#2563eb">账户</text>
        <text x="80" y="172" font-family="Arial" font-size="13" fill="#64748b">通知</text>
        <text x="80" y="208" font-family="Arial" font-size="13" fill="#64748b">隐私</text>`;
      content = `<rect x="296" y="40" width="616" height="520" rx="16" fill="#fff"/>
        <text x="324" y="84" font-family="Arial" font-size="22" font-weight="700" fill="#172033">账户信息</text>
        <text x="324" y="140" font-family="Arial" font-size="13" fill="#64748b">姓名</text><rect x="324" y="152" width="560" height="44" rx="10" fill="#f1f5f9"/>
        <text x="324" y="230" font-family="Arial" font-size="13" fill="#64748b">邮箱</text><rect x="324" y="242" width="560" height="44" rx="10" fill="#f1f5f9"/>`;
    } else {
      nav = `<rect x="48" y="40" width="220" height="520" rx="16" fill="#fff"/>
        <text x="76" y="76" font-family="Arial" font-size="14" font-weight="700" fill="#172033">设置</text>
        <rect x="56" y="96" width="196" height="44" rx="10" fill="#eff6ff"/><text x="72" y="124" font-family="Arial" font-size="13" font-weight="700" fill="#2563eb">账户</text>
        <text x="84" y="172" font-family="Arial" font-size="13" fill="#64748b">通知</text>
        <text x="76" y="208" font-family="Arial" font-size="13" fill="#64748b">隐私</text>`;
      content = `<rect x="296" y="40" width="616" height="520" rx="16" fill="#fff"/>
        <text x="340" y="84" font-family="Arial" font-size="22" font-weight="700" fill="#172033">账户信息</text>
        <text x="320" y="140" font-family="Arial" font-size="13" fill="#64748b">姓名</text><rect x="340" y="152" width="560" height="44" rx="10" fill="#f1f5f9"/>
        <text x="320" y="230" font-family="Arial" font-size="13" fill="#64748b">邮箱</text><rect x="340" y="242" width="560" height="44" rx="10" fill="#f1f5f9"/>`;
    }
  } else if (dimension === 'repetition') {
    if (isGood) {
      nav = `<rect x="48" y="40" width="220" height="520" rx="16" fill="#fff"/>
        <text x="72" y="76" font-family="Arial" font-size="14" font-weight="700" fill="#172033">设置</text>
        <rect x="60" y="96" width="196" height="44" rx="10" fill="#eff6ff"/><text x="80" y="124" font-family="Arial" font-size="13" font-weight="700" fill="#2563eb">账户</text>
        <rect x="60" y="152" width="196" height="44" rx="10" fill="#fff"/><text x="80" y="180" font-family="Arial" font-size="13" fill="#64748b">通知</text>
        <rect x="60" y="208" width="196" height="44" rx="10" fill="#fff"/><text x="80" y="236" font-family="Arial" font-size="13" fill="#64748b">隐私</text>`;
      content = `<rect x="296" y="40" width="616" height="520" rx="16" fill="#fff"/>
        <text x="324" y="84" font-family="Arial" font-size="22" font-weight="700" fill="#172033">账户信息</text>
        <rect x="324" y="120" width="560" height="80" rx="10" fill="#f8fafc"/>
        <rect x="324" y="216" width="560" height="80" rx="10" fill="#f8fafc"/>
        <rect x="324" y="312" width="560" height="80" rx="10" fill="#f8fafc"/>`;
    } else {
      nav = `<rect x="48" y="40" width="220" height="520" rx="16" fill="#fff"/>
        <text x="72" y="76" font-family="Arial" font-size="14" font-weight="700" fill="#172033">设置</text>
        <rect x="60" y="96" width="196" height="44" rx="4" fill="#eff6ff"/><text x="80" y="124" font-family="Arial" font-size="13" font-weight="700" fill="#2563eb">账户</text>
        <rect x="60" y="152" width="196" height="38" rx="20" fill="#fef3c7"/><text x="80" y="177" font-family="Arial" font-size="12" fill="#64748b">通知</text>
        <rect x="60" y="208" width="196" height="50" rx="0" fill="#f1f5f9"/><text x="80" y="240" font-family="Arial" font-size="14" fill="#64748b">隐私</text>`;
      content = `<rect x="296" y="40" width="616" height="520" rx="16" fill="#fff"/>
        <text x="324" y="84" font-family="Arial" font-size="22" font-weight="700" fill="#172033">账户信息</text>
        <rect x="324" y="120" width="560" height="80" rx="4" fill="#fff" stroke="#f59e0b"/>
        <rect x="324" y="216" width="560" height="80" rx="20" fill="#fef3c7"/>
        <rect x="324" y="312" width="560" height="80" rx="0" fill="#f1f5f9"/>`;
    }
  } else {
    // proximity
    if (isGood) {
      nav = `<rect x="48" y="40" width="220" height="520" rx="16" fill="#fff"/>
        <text x="72" y="76" font-family="Arial" font-size="14" font-weight="700" fill="#172033">设置</text>
        <rect x="60" y="96" width="196" height="44" rx="10" fill="#eff6ff"/><text x="80" y="124" font-family="Arial" font-size="13" font-weight="700" fill="#2563eb">账户</text>
        <text x="80" y="172" font-family="Arial" font-size="13" fill="#64748b">通知</text>
        <text x="80" y="208" font-family="Arial" font-size="13" fill="#64748b">隐私</text>
        <text x="80" y="244" font-family="Arial" font-size="13" fill="#64748b">安全</text>`;
      content = `<rect x="296" y="40" width="616" height="240" rx="16" fill="#fff"/>
        <text x="324" y="84" font-family="Arial" font-size="22" font-weight="700" fill="#172033">账户信息</text>
        <text x="324" y="116" font-family="Arial" font-size="13" fill="#64748b">姓名</text><rect x="324" y="128" width="560" height="40" rx="8" fill="#f1f5f9"/>
        <text x="324" y="184" font-family="Arial" font-size="13" fill="#64748b">邮箱</text><rect x="324" y="196" width="560" height="40" rx="8" fill="#f1f5f9"/>
        <rect x="296" y="300" width="616" height="120" rx="16" fill="#fff"/>
        <text x="324" y="338" font-family="Arial" font-size="16" font-weight="700" fill="#172033">通知偏好</text>
        <text x="324" y="370" font-family="Arial" font-size="13" fill="#64748b">接收产品更新和团队提醒</text>
        <rect x="296" y="440" width="616" height="120" rx="16" fill="#fff"/>
        <text x="324" y="478" font-family="Arial" font-size="16" font-weight="700" fill="#172033">隐私设置</text>
        <text x="324" y="510" font-family="Arial" font-size="13" fill="#64748b">管理你的数据可见性</text>`;
    } else {
      nav = `<rect x="48" y="40" width="220" height="520" rx="16" fill="#fff"/>
        <text x="72" y="76" font-family="Arial" font-size="14" font-weight="700" fill="#172033">设置</text>
        <rect x="60" y="96" width="196" height="44" rx="10" fill="#eff6ff"/><text x="80" y="124" font-family="Arial" font-size="13" font-weight="700" fill="#2563eb">账户</text>
        <text x="80" y="172" font-family="Arial" font-size="13" fill="#64748b">通知</text>
        <text x="80" y="208" font-family="Arial" font-size="13" fill="#64748b">隐私</text>
        <text x="80" y="244" font-family="Arial" font-size="13" fill="#64748b">安全</text>`;
      content = `<rect x="296" y="40" width="616" height="520" rx="16" fill="#fff"/>
        <text x="324" y="84" font-family="Arial" font-size="22" font-weight="700" fill="#172033">账户信息</text>
        <text x="324" y="130" font-family="Arial" font-size="13" fill="#64748b">姓名</text><rect x="324" y="160" width="560" height="40" rx="8" fill="#f1f5f9"/>
        <text x="324" y="210" font-family="Arial" font-size="13" fill="#64748b">邮箱</text><rect x="324" y="240" width="560" height="40" rx="8" fill="#f1f5f9"/>
        <text x="324" y="290" font-family="Arial" font-size="16" font-weight="700" fill="#172033">通知偏好</text>
        <text x="324" y="330" font-family="Arial" font-size="13" fill="#64748b">接收产品更新和团队提醒</text>
        <text x="324" y="380" font-family="Arial" font-size="16" font-weight="700" fill="#172033">隐私设置</text>
        <text x="324" y="420" font-family="Arial" font-size="13" fill="#64748b">管理你的数据可见性</text>`;
    }
  }
  return shell(nav + content);
}

/* ============ 布局模板分发表 ============ */
const LAYOUTS = [layout0, layout1, layout2, layout3, layout4, layout5, layout6, layout7, layout8, layout9];

/**
 * 生成训练题目的 A/B 图片
 * @param {Object} question - 题目对象（需包含 dimension, layoutIndex, goodOption）
 * @param {string} optionId - 'a' 或 'b'
 * @returns {string} SVG data URL
 */
export function getTrainingFixtureImage(question, optionId) {
  // 兼容：旧调用方式传入 questionId 字符串
  // 注意：trainingData.js 中 goodOption 基于 0-based index 计算（index % 2 === 0 ? 'b' : 'a'）
  // 此处的 id 数字是 1-based，因此需先减 1 还原为 0-based 再套用同一规则
  if (typeof question === 'string') {
    const dimension = question.split('-')[0];
    const oneBased = Number(question.split('-').pop()) || 1;
    const zeroBased = oneBased - 1;
    const layoutIndex = zeroBased % 10;
    const goodOption = zeroBased % 2 === 0 ? 'b' : 'a';
    const isGood = optionId === goodOption;
    const layout = LAYOUTS[layoutIndex] || LAYOUTS[0];
    return svgToDataUrl(layout(dimension, isGood));
  }

  const { dimension, layoutIndex = 0, goodOption = 'b' } = question;
  const isGood = optionId === goodOption;
  const layout = LAYOUTS[layoutIndex] || LAYOUTS[0];
  return svgToDataUrl(layout(dimension, isGood));
}
