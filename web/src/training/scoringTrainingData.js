// 维度打分训练题库：4 个评分维度 × 5 个场景，共 20 道。
// 每道题展示一张程序生成的页面设计图（SVG），用户为四个维度（排版布局/配色/字体层级/留白）各打 1～10 分。
// 不依赖任何摄影图库（Pexels/Unsplash 等）。
// 评分维度与诊断接口一致：layout / color / typography / whitespace。

export const SCORING_DIMENSIONS = {
  layout: '排版与布局',
  color: '配色',
  typography: '字体与文字层级',
  whitespace: '留白与视觉平衡',
};

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;

function svgToDataUrl(svg) {
  // 使用 base64，避免部分浏览器/HTML 属性转义导致的 SVG data URL 破图。
  const bytes = new TextEncoder().encode(svg);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

function shell(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" rx="20" fill="#f8fafc"/>
    ${content}
  </svg>`;
}

/**
 * 构建一道维度打分题。
 * @param {string} id - 题目 id，格式 score-{dimension}-NNN
 * @param {string} dimension - 侧重维度（仅作分类用，用户仍需为全部四个维度打分）
 * @param {string} scenario - 页面场景
 * @param {string} title - 题目标题
 * @param {string} svgContent - SVG 内容（不含外壳）
 * @returns {Object} 题目对象
 */
function buildQuestion(id, dimension, scenario, title, svgContent) {
  return {
    id,
    dimension,
    scenario,
    title,
    image: svgToDataUrl(shell(svgContent)),
  };
}

/* ============ 题目定义 ============ */
// 每道题的 SVG 刻意呈现不同质量水平的设计，供用户练习审美判断。

const QUESTIONS_RAW = [
  /* ---------- 排版与布局 layout ---------- */

  // 1. SaaS 着陆页：结构清晰，层次分明
  buildQuestion(
    'score-layout-001',
    'layout',
    'SaaS 着陆页',
    '评估这张 SaaS 着陆页的整体排版与布局',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/>
     <circle cx="80" cy="68" r="10" fill="#2563eb"/><text x="100" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#172033">Northstar</text>
     <text x="780" y="73" font-family="Arial" font-size="13" fill="#64748b">产品　方案　资源</text>
     <text x="80" y="180" font-family="Arial" font-size="40" font-weight="700" fill="#172033">让复杂工作变简单</text>
     <text x="82" y="218" font-family="Arial" font-size="16" fill="#64748b">一个清晰的工作台，帮助团队专注于重要的事。</text>
     <rect x="80" y="252" width="170" height="50" rx="12" fill="#2563eb"/><text x="120" y="283" font-family="Arial" font-size="15" font-weight="700" fill="#fff">开始使用</text>
     <rect x="270" y="252" width="140" height="50" rx="12" fill="#fff" stroke="#cbd5e1"/><text x="305" y="283" font-family="Arial" font-size="15" fill="#334155">了解更多</text>
     <rect x="80" y="360" width="260" height="170" rx="16" fill="#eff6ff"/><text x="104" y="400" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能一</text><text x="104" y="430" font-family="Arial" font-size="13" fill="#64748b">简短说明文字</text>
     <rect x="360" y="360" width="260" height="170" rx="16" fill="#eff6ff"/><text x="384" y="400" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能二</text><text x="384" y="430" font-family="Arial" font-size="13" fill="#64748b">简短说明文字</text>
     <rect x="640" y="360" width="240" height="170" rx="16" fill="#eff6ff"/><text x="664" y="400" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能三</text><text x="664" y="430" font-family="Arial" font-size="13" fill="#64748b">简短说明文字</text>`,
  ),

  // 2. 电商详情页：信息分区混乱
  buildQuestion(
    'score-layout-002',
    'layout',
    '电商详情页',
    '评估这张电商详情页的布局结构',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#172033">商品详情</text>
     <rect x="48" y="120" width="380" height="300" rx="12" fill="#e2e8f0"/>
     <text x="460" y="150" font-family="Arial" font-size="22" font-weight="700" fill="#172033">无线降噪耳机</text>
     <text x="460" y="200" font-family="Arial" font-size="28" font-weight="700" fill="#dc2626">¥1,299</text>
     <rect x="460" y="230" width="120" height="36" rx="8" fill="#2563eb"/><text x="486" y="254" font-family="Arial" font-size="13" fill="#fff">立即购买</text>
     <text x="80" y="460" font-family="Arial" font-size="14" font-weight="700" fill="#172033">规格参数</text>
     <text x="80" y="485" font-family="Arial" font-size="12" fill="#64748b">蓝牙5.3　降噪深度40dB　续航30h</text>
     <text x="500" y="460" font-family="Arial" font-size="14" font-weight="700" fill="#172033">用户评价</text>
     <text x="500" y="485" font-family="Arial" font-size="12" fill="#64748b">好评率 96%</text>
     <rect x="48" y="510" width="864" height="60" rx="12" fill="#fef3c7"/><text x="80" y="548" font-family="Arial" font-size="13" fill="#92400e">限时优惠：立减200元</text>
     <text x="700" y="548" font-family="Arial" font-size="12" fill="#64748b">剩余 2:34:11</text>`,
  ),

  // 3. 数据看板：栅格对齐良好
  buildQuestion(
    'score-layout-003',
    'layout',
    '数据看板',
    '评估这张数据看板的栅格布局',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="16" font-weight="700" fill="#172033">数据概览</text>
     <rect x="48" y="120" width="210" height="130" rx="14" fill="#fff"/><text x="72" y="155" font-family="Arial" font-size="13" fill="#64748b">用户</text><text x="72" y="200" font-family="Arial" font-size="26" font-weight="700" fill="#172033">12,480</text><text x="72" y="225" font-family="Arial" font-size="11" fill="#34c759">+3.2%</text>
     <rect x="278" y="120" width="210" height="130" rx="14" fill="#fff"/><text x="302" y="155" font-family="Arial" font-size="13" fill="#64748b">订单</text><text x="302" y="200" font-family="Arial" font-size="26" font-weight="700" fill="#172033">3,920</text><text x="302" y="225" font-family="Arial" font-size="11" fill="#34c759">+1.8%</text>
     <rect x="508" y="120" width="210" height="130" rx="14" fill="#fff"/><text x="532" y="155" font-family="Arial" font-size="13" fill="#64748b">营收</text><text x="532" y="200" font-family="Arial" font-size="26" font-weight="700" fill="#172033">¥86,200</text><text x="532" y="225" font-family="Arial" font-size="11" fill="#ff3b30">-1.1%</text>
     <rect x="738" y="120" width="174" height="130" rx="14" fill="#fff"/><text x="762" y="155" font-family="Arial" font-size="13" fill="#64748b">转化率</text><text x="762" y="200" font-family="Arial" font-size="26" font-weight="700" fill="#172033">4.2%</text><text x="762" y="225" font-family="Arial" font-size="11" fill="#34c759">+0.3%</text>
     <rect x="48" y="270" width="560" height="300" rx="14" fill="#fff"/><text x="72" y="305" font-family="Arial" font-size="14" font-weight="700" fill="#172033">趋势分析</text><rect x="72" y="325" width="520" height="220" rx="8" fill="#f1f5f9"/>
     <rect x="628" y="270" width="284" height="300" rx="14" fill="#fff"/><text x="652" y="305" font-family="Arial" font-size="14" font-weight="700" fill="#172033">来源分布</text><rect x="652" y="325" width="244" height="220" rx="8" fill="#f1f5f9"/>`,
  ),

  // 4. 表单页：字段排列拥挤
  buildQuestion(
    'score-layout-004',
    'layout',
    '注册表单',
    '评估这张注册表单的字段布局',
    `<rect x="280" y="40" width="400" height="520" rx="16" fill="#fff"/>
     <text x="320" y="90" font-family="Arial" font-size="22" font-weight="700" fill="#172033">创建账号</text>
     <text x="320" y="130" font-family="Arial" font-size="12" fill="#64748b">姓名</text>
     <rect x="320" y="138" width="320" height="38" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
     <text x="320" y="186" font-family="Arial" font-size="12" fill="#64748b">邮箱</text>
     <rect x="320" y="194" width="320" height="38" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
     <text x="320" y="242" font-family="Arial" font-size="12" fill="#64748b">密码</text>
     <rect x="320" y="250" width="320" height="38" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
     <text x="320" y="298" font-family="Arial" font-size="12" fill="#64748b">确认密码</text>
     <rect x="320" y="306" width="320" height="38" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
     <text x="320" y="354" font-family="Arial" font-size="12" fill="#64748b">手机号</text>
     <rect x="320" y="362" width="320" height="38" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
     <rect x="320" y="420" width="320" height="44" rx="10" fill="#2563eb"/><text x="440" y="448" font-family="Arial" font-size="15" font-weight="700" fill="#fff">注册</text>
     <text x="320" y="490" font-family="Arial" font-size="12" fill="#64748b">已有账号？登录</text>`,
  ),

  // 5. 内容详情页：双栏布局合理
  buildQuestion(
    'score-layout-005',
    'layout',
    '内容详情页',
    '评估这张内容详情页的版式布局',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#172033">设计原则</text>
     <rect x="48" y="120" width="580" height="450" rx="12" fill="#fff"/>
     <text x="80" y="165" font-family="Arial" font-size="13" fill="#64748b">2024-01-15　设计</text>
     <text x="80" y="205" font-family="Arial" font-size="26" font-weight="700" fill="#172033">四大设计原则详解</text>
     <text x="80" y="245" font-family="Arial" font-size="14" fill="#475569">对比、对齐、重复、亲密性是视觉设计的基石。</text>
     <rect x="80" y="265" width="520" height="1" fill="#e2e8f0"/>
     <text x="80" y="300" font-family="Arial" font-size="14" fill="#475569">对比（Contrast）的核心在于制造差异。</text>
     <text x="80" y="325" font-family="Arial" font-size="14" fill="#475569">通过对字号、颜色、形状的差异化处理，</text>
     <text x="80" y="350" font-family="Arial" font-size="14" fill="#475569">引导用户的视线聚焦到关键信息。</text>
     <text x="80" y="395" font-family="Arial" font-size="14" fill="#475569">对齐（Alignment）建立视觉秩序。</text>
     <text x="80" y="420" font-family="Arial" font-size="14" fill="#475569">统一的基线让页面看起来严谨专业。</text>
     <rect x="656" y="120" width="256" height="200" rx="12" fill="#fff"/><text x="680" y="155" font-family="Arial" font-size="14" font-weight="700" fill="#172033">目录</text>
     <text x="680" y="185" font-family="Arial" font-size="12" fill="#2563eb">1. 对比原则</text>
     <text x="680" y="210" font-family="Arial" font-size="12" fill="#64748b">2. 对齐原则</text>
     <text x="680" y="235" font-family="Arial" font-size="12" fill="#64748b">3. 重复原则</text>
     <text x="680" y="260" font-family="Arial" font-size="12" fill="#64748b">4. 亲密性原则</text>
     <rect x="656" y="340" width="256" height="230" rx="12" fill="#fef3c7"/><text x="680" y="375" font-family="Arial" font-size="13" font-weight="700" fill="#92400e">推荐阅读</text>
     <text x="680" y="405" font-family="Arial" font-size="12" fill="#92400e">写给大家的设计书</text>
     <text x="680" y="430" font-family="Arial" font-size="12" fill="#92400e">栅格系统与版式设计</text>`,
  ),

  /* ---------- 配色 color ---------- */

  // 6. 营销活动页：高饱和撞色
  buildQuestion(
    'score-color-001',
    'color',
    '营销活动页',
    '评估这张营销活动页的配色方案',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#ff00ff"/>
     <text x="80" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#ffff00">夏季大促</text>
     <rect x="48" y="120" width="864" height="200" rx="12" fill="#00ff00"/>
     <text x="200" y="200" font-family="Arial" font-size="48" font-weight="700" fill="#ff0000">5折起</text>
     <text x="200" y="250" font-family="Arial" font-size="20" fill="#0000ff">全场最低价 限时三天</text>
     <rect x="380" y="220" width="160" height="50" rx="12" fill="#ffff00"/><text x="420" y="252" font-family="Arial" font-size="16" font-weight="700" fill="#ff00ff">抢购</rect>
     <rect x="48" y="340" width="270" height="200" rx="12" fill="#ff8800"/>
     <text x="80" y="380" font-family="Arial" font-size="16" font-weight="700" fill="#00ff00">数码专区</text>
     <text x="80" y="410" font-family="Arial" font-size="13" fill="#ffffff">低至3折</text>
     <rect x="345" y="340" width="270" height="200" rx="12" fill="#ff00ff"/>
     <text x="375" y="380" font-family="Arial" font-size="16" font-weight="700" fill="#ffff00">服饰专区</text>
     <text x="375" y="410" font-family="Arial" font-size="13" fill="#00ff00">满199减100</text>
     <rect x="642" y="340" width="270" height="200" rx="12" fill="#00ffff"/>
     <text x="672" y="380" font-family="Arial" font-size="16" font-weight="700" fill="#ff0000">家居专区</text>
     <text x="672" y="410" font-family="Arial" font-size="13" fill="#0000ff">买一送一</text>`,
  ),

  // 7. SaaS 着陆页：低对比灰色调
  buildQuestion(
    'score-color-002',
    'color',
    'SaaS 着陆页',
    '评估这张 SaaS 着陆页的色彩对比',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#f1f5f9"/>
     <circle cx="80" cy="68" r="10" fill="#cbd5e1"/><text x="100" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#94a3b8">产品名</text>
     <text x="780" y="73" font-family="Arial" font-size="13" fill="#cbd5e1">功能　价格　关于</text>
     <text x="80" y="180" font-family="Arial" font-size="36" font-weight="700" fill="#94a3b8">提升团队效率</text>
     <text x="82" y="218" font-family="Arial" font-size="16" fill="#cbd5e1">简洁的工具，让协作更顺畅。</text>
     <rect x="80" y="252" width="170" height="50" rx="12" fill="#e2e8f0"/><text x="120" y="283" font-family="Arial" font-size="15" fill="#94a3b8">免费开始</rect>
     <rect x="270" y="252" width="140" height="50" rx="12" fill="#f1f5f9" stroke="#e2e8f0"/><text x="305" y="283" font-family="Arial" font-size="15" fill="#cbd5e1">查看演示</rect>
     <rect x="80" y="360" width="260" height="170" rx="16" fill="#f8fafc"/><text x="104" y="400" font-family="Arial" font-size="16" font-weight="700" fill="#cbd5e1">特性一</text><text x="104" y="430" font-family="Arial" font-size="13" fill="#e2e8f0">说明文字</text>
     <rect x="360" y="360" width="260" height="170" rx="16" fill="#f8fafc"/><text x="384" y="400" font-family="Arial" font-size="16" font-weight="700" fill="#cbd5e1">特性二</text><text x="384" y="430" font-family="Arial" font-size="13" fill="#e2e8f0">说明文字</text>
     <rect x="640" y="360" width="240" height="170" rx="16" fill="#f8fafc"/><text x="664" y="400" font-family="Arial" font-size="16" font-weight="700" fill="#cbd5e1">特性三</text><text x="664" y="430" font-family="Arial" font-size="13" fill="#e2e8f0">说明文字</text>`,
  ),

  // 8. 移动端界面：品牌色统一
  buildQuestion(
    'score-color-003',
    'color',
    '移动端界面',
    '评估这张移动端界面的品牌色运用',
    `<rect x="320" y="40" width="320" height="520" rx="24" fill="#fff"/>
     <rect x="320" y="40" width="320" height="60" rx="24" fill="#2563eb"/>
     <text x="345" y="78" font-family="Arial" font-size="16" font-weight="700" fill="#fff">我的钱包</text>
     <rect x="345" y="120" width="270" height="100" rx="16" fill="#2563eb"/>
     <text x="365" y="155" font-family="Arial" font-size="12" fill="#bfdbfe">总余额</text>
     <text x="365" y="190" font-family="Arial" font-size="28" font-weight="700" fill="#fff">¥8,640.50</text>
     <rect x="345" y="240" width="130" height="80" rx="12" fill="#eff6ff"/><text x="365" y="270" font-family="Arial" font-size="12" fill="#2563eb">收入</text><text x="365" y="298" font-family="Arial" font-size="18" font-weight="700" fill="#1e40af">¥3,200</text>
     <rect x="485" y="240" width="130" height="80" rx="12" fill="#fef2f2"/><text x="505" y="270" font-family="Arial" font-size="12" fill="#dc2626">支出</text><text x="505" y="298" font-family="Arial" font-size="18" font-weight="700" fill="#dc2626">¥1,580</text>
     <text x="345" y="355" font-family="Arial" font-size="14" font-weight="700" fill="#172033">最近交易</text>
     <rect x="345" y="370" width="270" height="50" rx="10" fill="#f8fafc"/><circle cx="370" cy="395" r="12" fill="#eff6ff"/><text x="395" y="390" font-family="Arial" font-size="13" fill="#172033">咖啡</text><text x="395" y="408" font-family="Arial" font-size="11" fill="#64748b">今天</text><text x="595" y="400" font-family="Arial" font-size="14" font-weight="700" fill="#dc2626">-¥32</text>
     <rect x="345" y="430" width="270" height="50" rx="10" fill="#f8fafc"/><circle cx="370" cy="455" r="12" fill="#eff6ff"/><text x="395" y="450" font-family="Arial" font-size="13" fill="#172033">工资</text><text x="395" y="468" font-family="Arial" font-size="11" fill="#64748b">昨天</text><text x="595" y="460" font-family="Arial" font-size="14" font-weight="700" fill="#34c759">+¥8,000</text>
     <rect x="345" y="490" width="270" height="50" rx="10" fill="#f8fafc"/><circle cx="370" cy="515" r="12" fill="#eff6ff"/><text x="395" y="510" font-family="Arial" font-size="13" fill="#172033">购物</text><text x="395" y="528" font-family="Arial" font-size="11" fill="#64748b">前天</text><text x="595" y="520" font-family="Arial" font-size="14" font-weight="700" fill="#dc2626">-¥286</text>`,
  ),

  // 9. 设置页：功能色运用
  buildQuestion(
    'score-color-004',
    'color',
    '设置页',
    '评估这张设置页的功能色使用',
    `<rect x="280" y="40" width="400" height="520" rx="16" fill="#fff"/>
     <text x="320" y="90" font-family="Arial" font-size="22" font-weight="700" fill="#172033">通知设置</text>
     <rect x="320" y="120" width="320" height="60" rx="10" fill="#f8fafc"/>
     <text x="340" y="145" font-family="Arial" font-size="14" font-weight="600" fill="#172033">邮件通知</text>
     <text x="340" y="165" font-family="Arial" font-size="12" fill="#64748b">接收产品更新邮件</text>
     <rect x="580" y="140" width="44" height="26" rx="13" fill="#34c759"/><circle cx="606" cy="153" r="10" fill="#fff"/>
     <rect x="320" y="195" width="320" height="60" rx="10" fill="#f8fafc"/>
     <text x="340" y="220" font-family="Arial" font-size="14" font-weight="600" fill="#172033">推送通知</text>
     <text x="340" y="240" font-family="Arial" font-size="12" fill="#64748b">接收实时推送</text>
     <rect x="580" y="215" width="44" height="26" rx="13" fill="#e2e8f0"/><circle cx="592" cy="228" r="10" fill="#fff"/>
     <rect x="320" y="280" width="320" height="60" rx="10" fill="#fef2f2"/>
     <text x="340" y="305" font-family="Arial" font-size="14" font-weight="600" fill="#dc2626">紧急告警</text>
     <text x="340" y="325" font-family="Arial" font-size="12" fill="#ef4444">安全相关事件将立即通知</text>
     <rect x="580" y="300" width="44" height="26" rx="13" fill="#34c759"/><circle cx="606" cy="313" r="10" fill="#fff"/>
     <rect x="320" y="365" width="320" height="60" rx="10" fill="#fffbeb"/>
     <text x="340" y="390" font-family="Arial" font-size="14" font-weight="600" fill="#d97706">每日摘要</text>
     <text x="340" y="410" font-family="Arial" font-size="12" fill="#f59e0b">每天早上8点发送摘要</text>
     <rect x="580" y="385" width="44" height="26" rx="13" fill="#34c759"/><circle cx="606" cy="398" r="10" fill="#fff"/>
     <rect x="320" y="465" width="320" height="50" rx="10" fill="#f1f5f9"/><text x="340" y="495" font-family="Arial" font-size="13" fill="#64748b">免打扰时段</text><text x="550" y="495" font-family="Arial" font-size="13" fill="#2563eb">22:00 - 08:00</text>`,
  ),

  // 10. 个人资料页：柔和配色
  buildQuestion(
    'score-color-005',
    'color',
    '个人资料页',
    '评估这张个人资料页的色彩搭配',
    `<rect x="280" y="40" width="400" height="520" rx="16" fill="#fff"/>
     <rect x="280" y="40" width="400" height="120" rx="16" fill="#f0f9ff"/>
     <circle cx="480" cy="100" r="36" fill="#0ea5e9"/>
     <text x="480" y="108" font-family="Arial" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">张</text>
     <text x="480" y="190" font-family="Arial" font-size="20" font-weight="700" fill="#0c4a6e" text-anchor="middle">张明</text>
     <text x="480" y="215" font-family="Arial" font-size="13" fill="#0369a1" text-anchor="middle">产品设计师</text>
     <rect x="320" y="240" width="320" height="70" rx="12" fill="#f0f9ff"/>
     <text x="340" y="265" font-family="Arial" font-size="12" fill="#0369a1">邮箱</text>
     <text x="340" y="288" font-family="Arial" font-size="14" font-weight="600" fill="#0c4a6e">zhang@example.com</text>
     <rect x="320" y="325" width="320" height="70" rx="12" fill="#f0f9ff"/>
     <text x="340" y="350" font-family="Arial" font-size="12" fill="#0369a1">所在城市</text>
     <text x="340" y="373" font-family="Arial" font-size="14" font-weight="600" fill="#0c4a6e">上海</text>
     <rect x="320" y="410" width="320" height="70" rx="12" fill="#f0f9ff"/>
     <text x="340" y="435" font-family="Arial" font-size="12" fill="#0369a1">加入时间</text>
     <text x="340" y="458" font-family="Arial" font-size="14" font-weight="600" fill="#0c4a6e">2023年6月</text>
     <rect x="320" y="500" width="150" height="44" rx="10" fill="#0ea5e9"/><text x="370" y="528" font-family="Arial" font-size="14" font-weight="600" fill="#fff">编辑资料</text>
     <rect x="490" y="500" width="150" height="44" rx="10" fill="#fff" stroke="#bae6fd"/><text x="540" y="528" font-family="Arial" font-size="14" font-weight="600" fill="#0369a1">退出登录</text>`,
  ),

  /* ---------- 字体与文字层级 typography ---------- */

  // 11. 博客列表：字号层级清晰
  buildQuestion(
    'score-typography-001',
    'typography',
    '博客列表',
    '评估这张博客列表的文字层级',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="18" font-weight="700" fill="#172033">最新文章</text>
     <rect x="48" y="120" width="864" height="110" rx="12" fill="#fff"/>
     <text x="80" y="150" font-family="Arial" font-size="11" fill="#64748b">设计</text>
     <text x="80" y="178" font-family="Arial" font-size="18" font-weight="700" fill="#172033">如何建立一致的设计系统</text>
     <text x="80" y="205" font-family="Arial" font-size="13" fill="#64748b">从颜色、字体、间距三个维度出发，构建可复用的设计令牌体系。</text>
     <rect x="48" y="246" width="864" height="110" rx="12" fill="#fff"/>
     <text x="80" y="276" font-family="Arial" font-size="11" fill="#64748b">开发</text>
     <text x="80" y="304" font-family="Arial" font-size="18" font-weight="700" fill="#172033">前端性能优化的七个关键点</text>
     <text x="80" y="331" font-family="Arial" font-size="13" fill="#64748b">从资源加载到渲染策略，系统化提升页面响应速度。</text>
     <rect x="48" y="372" width="864" height="110" rx="12" fill="#fff"/>
     <text x="80" y="402" font-family="Arial" font-size="11" fill="#64748b">产品</text>
     <text x="80" y="430" font-family="Arial" font-size="18" font-weight="700" fill="#172033">用户调研的常见误区</text>
     <text x="80" y="457" font-family="Arial" font-size="13" fill="#64748b">避免 Confirmation Bias，让数据说话而非让数据佐证假设。</text>
     <rect x="48" y="498" width="864" height="60" rx="12" fill="#f8fafc"/><text x="440" y="534" font-family="Arial" font-size="13" font-weight="600" fill="#2563eb">加载更多</text>`,
  ),

  // 12. 商品列表：字号无差异
  buildQuestion(
    'score-typography-002',
    'typography',
    '电商商品列表',
    '评估这张商品列表的字号层级',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="14" fill="#172033">商品列表</text>
     <rect x="48" y="120" width="270" height="220" rx="12" fill="#fff"/><rect x="48" y="120" width="270" height="140" rx="12" fill="#e2e8f0"/>
     <text x="72" y="285" font-family="Arial" font-size="14" fill="#172033">商品 A</text>
     <text x="72" y="310" font-family="Arial" font-size="14" fill="#dc2626">¥128</text>
     <rect x="345" y="120" width="270" height="220" rx="12" fill="#fff"/><rect x="345" y="120" width="270" height="140" rx="12" fill="#e2e8f0"/>
     <text x="369" y="285" font-family="Arial" font-size="14" fill="#172033">商品 B</text>
     <text x="369" y="310" font-family="Arial" font-size="14" fill="#dc2626">¥98</text>
     <rect x="642" y="120" width="270" height="220" rx="12" fill="#fff"/><rect x="642" y="120" width="270" height="140" rx="12" fill="#e2e8f0"/>
     <text x="666" y="285" font-family="Arial" font-size="14" fill="#172033">商品 C</text>
     <text x="666" y="310" font-family="Arial" font-size="14" fill="#dc2626">¥158</text>
     <rect x="48" y="360" width="270" height="220" rx="12" fill="#fff"/><rect x="48" y="360" width="270" height="140" rx="12" fill="#e2e8f0"/>
     <text x="72" y="525" font-family="Arial" font-size="14" fill="#172033">商品 D</text>
     <text x="72" y="550" font-family="Arial" font-size="14" fill="#dc2626">¥88</text>
     <rect x="345" y="360" width="270" height="220" rx="12" fill="#fff"/><rect x="345" y="360" width="270" height="140" rx="12" fill="#e2e8f0"/>
     <text x="369" y="525" font-family="Arial" font-size="14" fill="#172033">商品 E</text>
     <text x="369" y="550" font-family="Arial" font-size="14" fill="#dc2626">¥218</text>
     <rect x="642" y="360" width="270" height="220" rx="12" fill="#fff"/><rect x="642" y="360" width="270" height="140" rx="12" fill="#e2e8f0"/>
     <text x="666" y="525" font-family="Arial" font-size="14" fill="#172033">商品 F</text>
     <text x="666" y="550" font-family="Arial" font-size="14" fill="#dc2626">¥168</text>`,
  ),

  // 13. 数据看板：数字字号突出
  buildQuestion(
    'score-typography-003',
    'typography',
    '数据看板',
    '评估这张数据看板的数字层级',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="16" font-weight="700" fill="#172033">核心指标</text>
     <rect x="48" y="120" width="210" height="130" rx="14" fill="#fff"/>
     <text x="72" y="150" font-family="Arial" font-size="12" fill="#64748b">日活跃用户</text>
     <text x="72" y="200" font-family="Arial" font-size="32" font-weight="700" fill="#172033">48,392</text>
     <text x="72" y="225" font-family="Arial" font-size="11" fill="#34c759">↑ 12.3%</text>
     <rect x="278" y="120" width="210" height="130" rx="14" fill="#fff"/>
     <text x="302" y="150" font-family="Arial" font-size="12" fill="#64748b">新增注册</text>
     <text x="302" y="200" font-family="Arial" font-size="32" font-weight="700" fill="#172033">1,847</text>
     <text x="302" y="225" font-family="Arial" font-size="11" fill="#34c759">↑ 5.8%</text>
     <rect x="508" y="120" width="210" height="130" rx="14" fill="#fff"/>
     <text x="532" y="150" font-family="Arial" font-size="12" fill="#64748b">付费转化</text>
     <text x="532" y="200" font-family="Arial" font-size="32" font-weight="700" fill="#172033">6.4%</text>
     <text x="532" y="225" font-family="Arial" font-size="11" fill="#ff3b30">↓ 0.3%</text>
     <rect x="738" y="120" width="174" height="130" rx="14" fill="#fff"/>
     <text x="762" y="150" font-family="Arial" font-size="12" fill="#64748b">客单价</text>
     <text x="762" y="200" font-family="Arial" font-size="32" font-weight="700" fill="#172033">¥286</text>
     <text x="762" y="225" font-family="Arial" font-size="11" fill="#34c759">↑ 2.1%</text>
     <rect x="48" y="270" width="864" height="300" rx="14" fill="#fff"/>
     <text x="72" y="305" font-family="Arial" font-size="14" font-weight="700" fill="#172033">近7天趋势</text>
     <rect x="72" y="325" width="820" height="220" rx="8" fill="#f8fafc"/>
     <text x="100" y="370" font-family="Arial" font-size="11" fill="#94a3b8">50K</text>
     <text x="100" y="430" font-family="Arial" font-size="11" fill="#94a3b8">25K</text>
     <text x="100" y="490" font-family="Arial" font-size="11" fill="#94a3b8">0</text>`,
  ),

  // 14. 营销着陆页：字重混乱
  buildQuestion(
    'score-typography-004',
    'typography',
    '营销着陆页',
    '评估这张营销着陆页的字重运用',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#172033">品牌名</text>
     <text x="80" y="170" font-family="Arial" font-size="42" font-weight="400" fill="#172033">改变工作方式</text>
     <text x="80" y="210" font-family="Arial" font-size="16" font-weight="700" fill="#64748b">新一代协作平台</text>
     <rect x="80" y="240" width="180" height="50" rx="12" fill="#2563eb"/><text x="120" y="271" font-family="Arial" font-size="15" font-weight="400" fill="#fff">免费试用</rect>
     <rect x="280" y="240" width="140" height="50" rx="12" fill="#fff" stroke="#cbd5e1"/><text x="320" y="271" font-family="Arial" font-size="15" font-weight="700" fill="#334155">演示</text>
     <rect x="80" y="320" width="260" height="180" rx="16" fill="#f8fafc"/>
     <text x="104" y="360" font-family="Arial" font-size="22" font-weight="400" fill="#172033">实时协作</text>
     <text x="104" y="390" font-family="Arial" font-size="13" font-weight="700" fill="#64748b">多人同时编辑</text>
     <text x="104" y="420" font-family="Arial" font-size="13" font-weight="400" fill="#64748b">变更即时同步</text>
     <rect x="360" y="320" width="260" height="180" rx="16" fill="#f8fafc"/>
     <text x="384" y="360" font-family="Arial" font-size="22" font-weight="700" fill="#172033">智能搜索</text>
     <text x="384" y="390" font-family="Arial" font-size="13" font-weight="400" fill="#64748b">全文检索</text>
     <text x="384" y="420" font-family="Arial" font-size="13" font-weight="700" fill="#64748b">语义匹配</text>
     <rect x="640" y="320" width="240" height="180" rx="16" fill="#f8fafc"/>
     <text x="664" y="360" font-family="Arial" font-size="22" font-weight="400" fill="#172033">版本管理</text>
     <text x="664" y="390" font-family="Arial" font-size="13" font-weight="700" fill="#64748b">历史回溯</text>
     <text x="664" y="420" font-family="Arial" font-size="13" font-weight="400" fill="#64748b">差异对比</text>`,
  ),

  // 15. 消息中心：标签与正文区分
  buildQuestion(
    'score-typography-005',
    'typography',
    '消息中心',
    '评估这张消息中心的文字信息层级',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="18" font-weight="700" fill="#172033">消息中心</text>
     <rect x="48" y="120" width="864" height="100" rx="12" fill="#fff"/>
     <circle cx="80" cy="160" r="16" fill="#dbeafe"/>
     <text x="110" y="152" font-family="Arial" font-size="11" font-weight="600" fill="#2563eb">系统</text>
     <text x="110" y="175" font-family="Arial" font-size="15" font-weight="700" fill="#172033">账号安全提醒</text>
     <text x="110" y="198" font-family="Arial" font-size="12" fill="#64748b">检测到新设备登录，如非本人操作请立即修改密码。</text>
     <text x="860" y="152" font-family="Arial" font-size="11" fill="#94a3b8" text-anchor="end">10:30</text>
     <rect x="48" y="234" width="864" height="100" rx="12" fill="#fff"/>
     <circle cx="80" cy="274" r="16" fill="#dcfce7"/>
     <text x="110" y="266" font-family="Arial" font-size="11" font-weight="600" fill="#16a34a">订单</text>
     <text x="110" y="289" font-family="Arial" font-size="15" font-weight="700" fill="#172033">订单已发货</text>
     <text x="110" y="312" font-family="Arial" font-size="12" fill="#64748b">您的订单 #20240115 已由顺丰快递发出，预计明日送达。</text>
     <text x="860" y="266" font-family="Arial" font-size="11" fill="#94a3b8" text-anchor="end">09:15</text>
     <rect x="48" y="348" width="864" height="100" rx="12" fill="#fff"/>
     <circle cx="80" cy="388" r="16" fill="#fef3c7"/>
     <text x="110" y="380" font-family="Arial" font-size="11" font-weight="600" fill="#d97706">活动</text>
     <text x="110" y="403" font-family="Arial" font-size="15" font-weight="700" fill="#172033">会员日特惠开启</text>
     <text x="110" y="426" font-family="Arial" font-size="12" fill="#64748b">每月8号会员专享，全场商品额外95折，上不封顶。</text>
     <text x="860" y="380" font-family="Arial" font-size="11" fill="#94a3b8" text-anchor="end">昨天</text>
     <rect x="48" y="462" width="864" height="100" rx="12" fill="#f8fafc"/>
     <circle cx="80" cy="502" r="16" fill="#e2e8f0"/>
     <text x="110" y="494" font-family="Arial" font-size="11" font-weight="600" fill="#64748b">通知</text>
     <text x="110" y="517" font-family="Arial" font-size="15" font-weight="700" fill="#64748b">功能更新公告</text>
     <text x="110" y="540" font-family="Arial" font-size="12" fill="#94a3b8">v2.4.0 版本已上线，新增数据导出与批量操作功能。</text>
     <text x="860" y="494" font-family="Arial" font-size="11" fill="#cbd5e1" text-anchor="end">3天前</text>`,
  ),

  /* ---------- 留白与视觉平衡 whitespace ---------- */

  // 16. 支付页面：留白充足
  buildQuestion(
    'score-whitespace-001',
    'whitespace',
    '支付页面',
    '评估这张支付页面的留白处理',
    `<rect x="280" y="40" width="400" height="520" rx="16" fill="#fff"/>
     <text x="480" y="100" font-family="Arial" font-size="22" font-weight="700" fill="#172033" text-anchor="middle">确认支付</text>
     <text x="480" y="180" font-family="Arial" font-size="13" fill="#64748b" text-anchor="middle">支付金额</text>
     <text x="480" y="230" font-family="Arial" font-size="40" font-weight="700" fill="#172033" text-anchor="middle">¥299.00</text>
     <rect x="320" y="280" width="320" height="1" fill="#e2e8f0"/>
     <text x="320" y="320" font-family="Arial" font-size="13" fill="#64748b">商品</text>
     <text x="640" y="320" font-family="Arial" font-size="13" fill="#172033" text-anchor="end">Pro 年度会员</text>
     <text x="320" y="350" font-family="Arial" font-size="13" fill="#64748b">优惠</text>
     <text x="640" y="350" font-family="Arial" font-size="13" fill="#dc2626" text-anchor="end">-¥100.00</text>
     <rect x="320" y="380" width="320" height="1" fill="#e2e8f0"/>
     <text x="320" y="420" font-family="Arial" font-size="13" fill="#64748b">实付</text>
     <text x="640" y="420" font-family="Arial" font-size="15" font-weight="700" fill="#172033" text-anchor="end">¥299.00</text>
     <rect x="320" y="470" width="320" height="50" rx="12" fill="#2563eb"/><text x="480" y="501" font-family="Arial" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">确认支付 ¥299</text>`,
  ),

  // 17. 功能卡片列表：间距拥挤
  buildQuestion(
    'score-whitespace-002',
    'whitespace',
    '功能卡片列表',
    '评估这张功能卡片列表的间距处理',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="16" font-weight="700" fill="#172033">核心功能</text>
     <rect x="48" y="110" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="80" cy="140" r="14" fill="#dbeafe"/><text x="72" y="185" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能一</text><text x="72" y="215" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>
     <rect x="340" y="110" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="372" cy="140" r="14" fill="#fef3c7"/><text x="364" y="185" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能二</text><text x="364" y="215" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>
     <rect x="632" y="110" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="664" cy="140" r="14" fill="#dcfce7"/><text x="656" y="185" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能三</text><text x="656" y="215" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>
     <rect x="48" y="258" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="80" cy="288" r="14" fill="#fce7f3"/><text x="72" y="333" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能四</text><text x="72" y="363" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>
     <rect x="340" y="258" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="372" cy="288" r="14" fill="#e0e7ff"/><text x="364" y="333" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能五</text><text x="364" y="363" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>
     <rect x="632" y="258" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="664" cy="288" r="14" fill="#fef9c3"/><text x="656" y="333" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能六</text><text x="656" y="363" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>
     <rect x="48" y="406" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="80" cy="436" r="14" fill="#cffafe"/><text x="72" y="481" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能七</text><text x="72" y="511" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>
     <rect x="340" y="406" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="372" cy="436" r="14" fill="#ede9fe"/><text x="364" y="481" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能八</text><text x="364" y="511" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>
     <rect x="632" y="406" width="280" height="140" rx="14" fill="#fff" stroke="#e2e8f0"/><circle cx="664" cy="436" r="14" fill="#fee2e2"/><text x="656" y="481" font-family="Arial" font-size="16" font-weight="700" fill="#172033">功能九</text><text x="656" y="511" font-family="Arial" font-size="12" fill="#64748b">说明文字内容</text>`,
  ),

  // 18. 招聘列表：留白合理
  buildQuestion(
    'score-whitespace-003',
    'whitespace',
    '招聘列表',
    '评估这张招聘列表的视觉平衡',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="73" font-family="Arial" font-size="18" font-weight="700" fill="#172033">热门职位</text>
     <rect x="48" y="130" width="864" height="90" rx="12" fill="#fff"/>
     <text x="80" y="165" font-family="Arial" font-size="16" font-weight="700" fill="#172033">高级前端工程师</text>
     <text x="80" y="190" font-family="Arial" font-size="13" fill="#64748b">上海　3-5年　本科</text>
     <text x="860" y="170" font-family="Arial" font-size="16" font-weight="700" fill="#dc2626" text-anchor="end">25-40K</text>
     <text x="860" y="195" font-family="Arial" font-size="11" fill="#94a3b8" text-anchor="end">14薪</text>
     <rect x="48" y="250" width="864" height="90" rx="12" fill="#fff"/>
     <text x="80" y="285" font-family="Arial" font-size="16" font-weight="700" fill="#172033">产品设计师</text>
     <text x="80" y="310" font-family="Arial" font-size="13" fill="#64748b">北京　3-5年　本科</text>
     <text x="860" y="290" font-family="Arial" font-size="16" font-weight="700" fill="#dc2626" text-anchor="end">20-35K</text>
     <text x="860" y="315" font-family="Arial" font-size="11" fill="#94a3b8" text-anchor="end">13薪</text>
     <rect x="48" y="370" width="864" height="90" rx="12" fill="#fff"/>
     <text x="80" y="405" font-family="Arial" font-size="16" font-weight="700" fill="#172033">数据分析师</text>
     <text x="80" y="430" font-family="Arial" font-size="13" fill="#64748b">杭州　1-3年　本科</text>
     <text x="860" y="410" font-family="Arial" font-size="16" font-weight="700" fill="#dc2626" text-anchor="end">18-30K</text>
     <text x="860" y="435" font-family="Arial" font-size="11" fill="#94a3b8" text-anchor="end">14薪</text>
     <rect x="48" y="490" width="864" height="60" rx="12" fill="#f8fafc"/><text x="440" y="526" font-family="Arial" font-size="13" font-weight="600" fill="#2563eb">查看全部职位</text>`,
  ),

  // 19. 移动端卡片：留白不足
  buildQuestion(
    'score-whitespace-004',
    'whitespace',
    '移动端卡片',
    '评估这张移动端卡片的内部留白',
    `<rect x="320" y="40" width="320" height="520" rx="24" fill="#fff"/>
     <rect x="320" y="40" width="320" height="56" rx="24" fill="#2563eb"/><text x="345" y="75" font-family="Arial" font-size="16" font-weight="700" fill="#fff">订单详情</text>
     <rect x="340" y="108" width="280" height="80" rx="12" fill="#f8fafc"/>
     <text x="355" y="130" font-family="Arial" font-size="12" fill="#64748b">订单号</text>
     <text x="355" y="150" font-family="Arial" font-size="13" font-weight="600" fill="#172033">#20240115001</text>
     <text x="355" y="172" font-family="Arial" font-size="11" fill="#64748b">2024-01-15 10:30</text>
     <rect x="340" y="196" width="280" height="80" rx="12" fill="#f8fafc"/>
     <text x="355" y="218" font-family="Arial" font-size="12" fill="#64748b">收货地址</text>
     <text x="355" y="238" font-family="Arial" font-size="13" font-weight="600" fill="#172033">上海市浦东新区张江路</text>
     <text x="355" y="260" font-family="Arial" font-size="11" fill="#64748b">张明 138****8888</text>
     <rect x="340" y="284" width="280" height="100" rx="12" fill="#f8fafc"/>
     <text x="355" y="306" font-family="Arial" font-size="12" fill="#64748b">商品</text>
     <text x="355" y="328" font-family="Arial" font-size="13" font-weight="600" fill="#172033">无线降噪耳机 ×1</text>
     <text x="355" y="350" font-family="Arial" font-size="13" font-weight="600" fill="#172033">保护壳 ×1</text>
     <text x="355" y="372" font-family="Arial" font-size="11" fill="#64748b">共2件商品</text>
     <rect x="340" y="392" width="280" height="60" rx="12" fill="#f8fafc"/>
     <text x="355" y="414" font-family="Arial" font-size="12" fill="#64748b">实付金额</text>
     <text x="355" y="440" font-family="Arial" font-size="18" font-weight="700" fill="#dc2626">¥1,399</text>
     <rect x="340" y="462" width="280" height="44" rx="10" fill="#2563eb"/><text x="480" y="490" font-family="Arial" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">确认收货</text>`,
  ),

  // 20. 内容详情页：大留白阅读体验
  buildQuestion(
    'score-whitespace-005',
    'whitespace',
    '文章详情页',
    '评估这张文章详情页的阅读留白',
    `<rect x="200" y="40" width="560" height="520" rx="16" fill="#fff"/>
     <text x="480" y="110" font-family="Arial" font-size="11" fill="#94a3b8" text-anchor="middle">设计　·　5分钟阅读</text>
     <text x="480" y="160" font-family="Arial" font-size="28" font-weight="700" fill="#172033" text-anchor="middle">留白的力量</text>
     <rect x="280" y="190" width="400" height="1" fill="#e2e8f0"/>
     <text x="240" y="250" font-family="Arial" font-size="15" fill="#475569">留白不是浪费空间，而是给内容呼吸的机会。</text>
     <text x="240" y="290" font-family="Arial" font-size="15" fill="#475569">好的留白能够引导视线、建立层次、</text>
     <text x="240" y="330" font-family="Arial" font-size="15" fill="#475569">降低认知负荷，让用户专注于核心信息。</text>
     <text x="240" y="390" font-family="Arial" font-size="15" fill="#475569">在排版中，留白分为微观与宏观两个层面。</text>
     <text x="240" y="430" font-family="Arial" font-size="15" fill="#475569">微观留白控制字间距、行高、段间距；</text>
     <text x="240" y="470" font-family="Arial" font-size="15" fill="#475569">宏观留白决定区块、栏、页面的整体节奏。</text>
     <text x="240" y="530" font-family="Arial" font-size="13" fill="#94a3b8">—— 摘自《设计的原则》</text>`,
  ),
];

export const scoringQuestions = QUESTIONS_RAW;

export function getScoringQuestionById(id) {
  if (!id || typeof id !== 'string') return null;
  return scoringQuestions.find((q) => q.id === id) || null;
}

export function getScoringQuestionsByDimension(dimension) {
  if (!dimension || typeof dimension !== 'string') return [];
  return scoringQuestions.filter((q) => q.dimension === dimension);
}

/**
 * 校验题库完整性
 * @returns {Array<string>} 问题列表，空数组表示通过
 */
export function validateScoringQuestions() {
  const issues = [];

  // 总数至少 20
  if (scoringQuestions.length < 20) {
    issues.push(`题库总数不足 20，实际 ${scoringQuestions.length}`);
  }

  // 每维度至少 5
  for (const dim of Object.keys(SCORING_DIMENSIONS)) {
    const count = getScoringQuestionsByDimension(dim).length;
    if (count < 5) {
      issues.push(`${dim} 维度题目不足 5 道，实际 ${count}`);
    }
  }

  // ID 唯一
  const ids = new Set();
  for (const q of scoringQuestions) {
    if (ids.has(q.id)) issues.push(`ID 重复: ${q.id}`);
    ids.add(q.id);
  }

  // ID 格式 score-{dimension}-NNN
  const idPattern = /^score-(layout|color|typography|whitespace)-\d{3}$/;
  for (const q of scoringQuestions) {
    if (!idPattern.test(q.id)) issues.push(`ID 格式错误: ${q.id}`);
  }

  // 场景非空
  for (const q of scoringQuestions) {
    if (!q.scenario || !q.scenario.trim()) issues.push(`${q.id} 场景为空`);
  }

  // 图片为合法 data URL
  for (const q of scoringQuestions) {
    if (typeof q.image !== 'string' || !q.image.startsWith('data:image/svg+xml')) {
      issues.push(`${q.id} 图片非合法 SVG data URL`);
    }
  }

  // 同维度内场景不重复
  for (const dim of Object.keys(SCORING_DIMENSIONS)) {
    const dimQuestions = getScoringQuestionsByDimension(dim);
    const scenarios = dimQuestions.map((q) => q.scenario);
    const unique = new Set(scenarios);
    if (unique.size !== scenarios.length) {
      issues.push(`${dim} 维度内场景重复`);
    }
  }

  return issues;
}
