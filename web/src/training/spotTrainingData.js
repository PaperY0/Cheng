// 找茬训练题库：4 个设计维度 × 5 个场景，共 20 道。
// 每道题包含一张程序生成的页面设计图（SVG）和 2~4 个问题热点区域。
// 热点坐标基于 960×600 画布，必须落在图片范围内，热点之间不能全部重叠。
// 不依赖任何摄影图库（Pexels/Unsplash 等）。

export const SPOT_DIMENSIONS = {
  contrast: '对比',
  alignment: '对齐',
  repetition: '重复',
  proximity: '亲密性',
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
 * 构建一道找茬题。
 * @param {string} id - 题目 id
 * @param {string} dimension - 设计维度
 * @param {string} scenario - 页面场景
 * @param {string} title - 题目标题
 * @param {string} svgContent - SVG 内容（不含外壳）
 * @param {Array} hotspots - 热点区域 [{ id, x, y, width, height, issue, principle, explanation, suggestion }]
 * @returns {Object} 题目对象
 */
function buildQuestion(id, dimension, scenario, title, svgContent, hotspots) {
  return {
    id,
    dimension,
    scenario,
    title,
    image: svgToDataUrl(shell(svgContent)),
    hotspots,
  };
}

/* ============ 题目定义 ============ */
// 每道题的 SVG 与热点坐标成对编写，确保热点精准覆盖问题区域。

const QUESTIONS_RAW = [
  /* ---------- 对比 contrast ---------- */

  // 1. SaaS 首页：标题层级不足 + CTA 低对比
  buildQuestion(
    'spot-contrast-001',
    'contrast',
    'SaaS 首页',
    '找出页面中信息层级与行动引导的对比问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/>
     <circle cx="80" cy="68" r="10" fill="#94a3b8"/><text x="100" y="73" font-family="Arial" font-size="15" fill="#64748b">Northstar</text>
     <text x="80" y="180" font-family="Arial" font-size="22" fill="#475569">让复杂工作变简单</text>
     <text x="82" y="214" font-family="Arial" font-size="18" fill="#64748b">一个清晰的工作台。</text>
     <rect x="80" y="252" width="170" height="50" rx="12" fill="#94a3b8"/><text x="120" y="283" font-family="Arial" font-size="15" fill="#fff">开始使用</text>
     <rect x="270" y="252" width="140" height="50" rx="12" fill="#cbd5e1"/><text x="305" y="283" font-family="Arial" font-size="15" fill="#fff">了解更多</text>
     <rect x="80" y="360" width="240" height="150" rx="14" fill="#f1f5f9"/><text x="104" y="400" font-family="Arial" font-size="16" fill="#94a3b8">功能一</text>
     <rect x="360" y="360" width="240" height="150" rx="14" fill="#f1f5f9"/><text x="384" y="400" font-family="Arial" font-size="16" fill="#94a3b8">功能二</text>`,
    [
      { id: 'h1', x: 60, y: 155, width: 320, height: 70, issue: '标题与正文字号差异不足，未建立视觉层级', principle: '对比', explanation: '标题字号偏小且颜色偏灰，与正文接近，用户无法快速识别页面主题。', suggestion: '增大标题字号至 36px 以上并提高字重，正文使用更低饱和的中性色。' },
      { id: 'h2', x: 70, y: 245, width: 350, height: 65, issue: '主操作按钮色彩饱和度低，与次要按钮对比不足', principle: '对比', explanation: 'CTA 使用灰色填充，与次要按钮视觉权重接近，主操作路径不清晰。', suggestion: '主按钮使用高饱和品牌色填充，次要按钮改为描边态以形成强对比。' },
    ],
  ),

  // 2. 电商商品页：价格不突出 + 按钮融入背景
  buildQuestion(
    'spot-contrast-002',
    'contrast',
    '电商商品页',
    '找出商品页中价格与行动按钮的对比问题',
    `<rect x="48" y="40" width="864" height="52" rx="12" fill="#fff"/><text x="80" y="72" font-family="Arial" font-size="15" font-weight="700" fill="#172033">Shop</text>
     <rect x="48" y="120" width="380" height="380" rx="16" fill="#e2e8f0"/><circle cx="238" cy="310" r="60" fill="#cbd5e1"/>
     <text x="460" y="180" font-family="Arial" font-size="20" fill="#475569">羊毛混纺大衣</text>
     <text x="460" y="230" font-family="Arial" font-size="20" fill="#475569">¥1,280</text>
     <text x="460" y="270" font-family="Arial" font-size="18" fill="#64748b">原价 ¥1,580</text>
     <rect x="460" y="310" width="180" height="52" rx="12" fill="#cbd5e1"/><text x="500" y="342" font-family="Arial" font-size="15" fill="#fff">加入购物车</text>`,
    [
      { id: 'h1', x: 450, y: 205, width: 200, height: 75, issue: '价格字号与商品名接近，未形成强调', principle: '对比', explanation: '价格与商品名字号、颜色相同，用户难以快速获取关键决策信息。', suggestion: '价格使用更大字号与强调色（如红色），与商品名形成明显层级。' },
      { id: 'h2', x: 450, y: 300, width: 200, height: 70, issue: '购买按钮使用灰色，与背景对比不足', principle: '对比', explanation: '按钮灰色填充导致行动入口不突出，降低转化引导力。', suggestion: '按钮改用高饱和品牌色，与浅色背景形成强对比。' },
    ],
  ),

  // 3. 数据看板：指标无层级 + 趋势文字过浅
  buildQuestion(
    'spot-contrast-003',
    'contrast',
    '数据看板',
    '找出看板中指标层级的对比问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="76" font-family="Arial" font-size="18" font-weight="700" fill="#172033">数据概览</text>
     <rect x="48" y="130" width="270" height="130" rx="14" fill="#fff"/><text x="72" y="170" font-family="Arial" font-size="14" fill="#64748b">月活跃用户</text><text x="72" y="220" font-family="Arial" font-size="22" fill="#475569">12,480</text><text x="72" y="245" font-family="Arial" font-size="11" fill="#cbd5e1">较上周 +3.2%</text>
     <rect x="345" y="130" width="270" height="130" rx="14" fill="#fff"/><text x="369" y="170" font-family="Arial" font-size="14" fill="#64748b">订单量</text><text x="369" y="220" font-family="Arial" font-size="22" fill="#475569">3,920</text><text x="369" y="245" font-family="Arial" font-size="11" fill="#cbd5e1">较上周 -1.1%</text>
     <rect x="642" y="130" width="270" height="130" rx="14" fill="#fff"/><text x="666" y="170" font-family="Arial" font-size="14" fill="#64748b">营收</text><text x="666" y="220" font-family="Arial" font-size="22" fill="#475569">¥86,200</text>`,
    [
      { id: 'h1', x: 60, y: 195, width: 260, height: 32, issue: '核心数字字号偏小，与标题标签层级不足', principle: '对比', explanation: '指标数字与标签字号接近，核心 KPI 无法一眼可读。', suggestion: '核心数字放大至 32px 以上并用强调色，标签保持小字中性色。' },
      { id: 'h2', x: 60, y: 230, width: 260, height: 30, issue: '趋势说明文字颜色过浅，几乎不可读', principle: '对比', explanation: '趋势文字使用极浅灰色，与背景对比度低于可读阈值。', suggestion: '趋势文字使用语义色（上涨绿/下跌红）并提高字号至 12px 以上。' },
      { id: 'h3', x: 345, y: 195, width: 260, height: 55, issue: '多个指标卡数字字号统一但无主次', principle: '对比', explanation: '所有指标同等大小，用户找不到应该优先关注的核心指标。', suggestion: '核心指标用更大字号或强调色凸显，次级指标保持常规字号。' },
    ],
  ),

  // 4. 登录页：主按钮弱 + 次要链接竞争
  buildQuestion(
    'spot-contrast-004',
    'contrast',
    '登录页',
    '找出登录页中主操作引导的对比问题',
    `<rect x="280" y="80" width="400" height="440" rx="20" fill="#fff"/>
     <text x="480" y="150" font-family="Arial" font-size="20" fill="#475569" text-anchor="middle">欢迎回来</text>
     <rect x="320" y="190" width="320" height="48" rx="10" fill="#f1f5f9"/><text x="340" y="220" font-family="Arial" font-size="14" fill="#94a3b8">邮箱</text>
     <rect x="320" y="256" width="320" height="48" rx="10" fill="#f1f5f9"/><text x="340" y="286" font-family="Arial" font-size="14" fill="#94a3b8">密码</text>
     <rect x="320" y="330" width="320" height="48" rx="10" fill="#cbd5e1"/><text x="480" y="360" font-family="Arial" font-size="15" fill="#fff" text-anchor="middle">登录</text>
     <text x="480" y="410" font-family="Arial" font-size="15" font-weight="700" fill="#475569" text-anchor="middle">注册新账号</text>`,
    [
      { id: 'h1', x: 310, y: 320, width: 340, height: 65, issue: '主操作按钮使用灰色，视觉权重不足', principle: '对比', explanation: '登录按钮灰色填充，无法与背景形成强对比，主操作引导弱。', suggestion: '主按钮使用高饱和品牌色，形成强视觉焦点。' },
      { id: 'h2', x: 380, y: 390, width: 200, height: 40, issue: '次要链接加粗且颜色较深，与主按钮竞争注意力', principle: '对比', explanation: '注册链接字号大且加粗，与主按钮视觉权重接近，用户犹豫该点哪个。', suggestion: '次要链接降低字号和字重，改为中性色文字态，凸显主按钮。' },
    ],
  ),

  // 5. 支付页：金额过小 + 按钮低对比
  buildQuestion(
    'spot-contrast-005',
    'contrast',
    '支付页',
    '找出支付页中金额与提交按钮的对比问题',
    `<rect x="280" y="60" width="400" height="480" rx="20" fill="#fff"/>
     <text x="480" y="120" font-family="Arial" font-size="16" fill="#64748b" text-anchor="middle">订单金额</text>
     <text x="480" y="160" font-family="Arial" font-size="18" fill="#475569" text-anchor="middle">¥ 1,280.00</text>
     <rect x="320" y="200" width="320" height="1" fill="#e2e8f0"/>
     <text x="320" y="240" font-family="Arial" font-size="14" fill="#64748b">商品金额</text><text x="640" y="240" font-family="Arial" font-size="14" fill="#475569" text-anchor="end">¥1,280.00</text>
     <text x="320" y="275" font-family="Arial" font-size="14" fill="#64748b">运费</text><text x="640" y="275" font-family="Arial" font-size="14" fill="#475569" text-anchor="end">¥0.00</text>
     <rect x="320" y="430" width="320" height="52" rx="12" fill="#94a3b8"/><text x="480" y="463" font-family="Arial" font-size="16" fill="#fff" text-anchor="middle">确认支付</text>`,
    [
      { id: 'h1', x: 360, y: 135, width: 240, height: 50, issue: '应付金额字号过小，未形成视觉焦点', principle: '对比', explanation: '金额字号与标题接近，用户难以快速核对关键数额。', suggestion: '金额放大至 32px 以上并用强调色，与标题形成明显层级。' },
      { id: 'h2', x: 310, y: 420, width: 340, height: 70, issue: '支付按钮灰色填充，对比不足', principle: '对比', explanation: '支付按钮使用低饱和灰色，行动引导力弱。', suggestion: '按钮改用高饱和品牌色，推动用户完成支付。' },
    ],
  ),

  /* ---------- 对齐 alignment ---------- */

  // 6. SaaS 首页：导航与内容错位 + 卡片高度不一
  buildQuestion(
    'spot-alignment-001',
    'alignment',
    'SaaS 首页',
    '找出页面中元素基线错位的对齐问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/>
     <circle cx="80" cy="68" r="10" fill="#2563eb"/><text x="100" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#172033">Northstar</text>
     <text x="780" y="73" font-family="Arial" font-size="13" fill="#64748b">产品　方案</text>
     <text x="110" y="180" font-family="Arial" font-size="32" font-weight="700" fill="#172033">让复杂工作变简单</text>
     <text x="140" y="218" font-family="Arial" font-size="14" fill="#64748b">一个清晰的工作台。</text>
     <rect x="95" y="258" width="160" height="46" rx="12" fill="#2563eb"/>
     <rect x="80" y="358" width="220" height="150" rx="14" fill="#f8fafc"/><text x="104" y="396" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能一</text>
     <rect x="340" y="338" width="220" height="180" rx="14" fill="#f8fafc"/><text x="364" y="378" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能二</text>
     <rect x="600" y="372" width="220" height="130" rx="14" fill="#f8fafc"/><text x="624" y="410" font-family="Arial" font-size="15" font-weight="700" fill="#172033">功能三</text>`,
    [
      { id: 'h1', x: 90, y: 165, width: 280, height: 65, issue: '标题、副标题、按钮左基线不一致', principle: '对齐', explanation: '标题、副标题、按钮的左边界分别在不同 x 位置，视觉骨架松散。', suggestion: '所有元素左对齐到同一基线（如 x=80），建立统一视觉骨架。' },
      { id: 'h2', x: 70, y: 330, width: 760, height: 200, issue: '三张功能卡片高度和垂直位置不一致', principle: '对齐', explanation: '卡片顶部 y 坐标和高度各异，破坏了网格秩序。', suggestion: '卡片等高排列，顶部对齐到同一基线，形成稳定网格。' },
    ],
  ),

  // 7. 表单页：标签与输入框错位 + 按钮偏移
  buildQuestion(
    'spot-alignment-002',
    'alignment',
    '表单页',
    '找出表单中字段与按钮的对齐问题',
    `<rect x="280" y="60" width="400" height="480" rx="20" fill="#fff"/>
     <text x="320" y="120" font-family="Arial" font-size="20" font-weight="700" fill="#172033">联系我们</text>
     <text x="310" y="170" font-family="Arial" font-size="13" fill="#64748b">姓名</text>
     <rect x="320" y="185" width="320" height="44" rx="8" fill="#f1f5f9"/>
     <text x="330" y="245" font-family="Arial" font-size="13" fill="#64748b">邮箱</text>
     <rect x="320" y="260" width="300" height="44" rx="8" fill="#f1f5f9"/>
     <text x="350" y="325" font-family="Arial" font-size="13" fill="#64748b">留言</text>
     <rect x="340" y="340" width="300" height="80" rx="8" fill="#f1f5f9"/>
     <rect x="350" y="450" width="160" height="46" rx="12" fill="#2563eb"/>`,
    [
      { id: 'h1', x: 300, y: 155, width: 350, height: 110, issue: '标签与输入框左基线不一致', principle: '对齐', explanation: '姓名标签 x=310，输入框 x=320；邮箱标签 x=330，输入框 x=320，基线错位。', suggestion: '标签与输入框左对齐到同一基线，形成清晰的填写路径。' },
      { id: 'h2', x: 340, y: 330, width: 320, height: 100, issue: '留言标签与文本框基线错位', principle: '对齐', explanation: '留言标签 x=350，文本框 x=340，左右基线不统一。', suggestion: '标签与文本框左对齐到同一基线。' },
      { id: 'h3', x: 340, y: 440, width: 180, height: 65, issue: '提交按钮与表单字段未对齐', principle: '对齐', explanation: '按钮 x=350，与上方输入框 x=320 基线不一致。', suggestion: '按钮与输入框左对齐到同一基线，或与表单同宽对齐。' },
    ],
  ),

  // 8. 数据看板：卡片未网格对齐 + 表头错位
  buildQuestion(
    'spot-alignment-003',
    'alignment',
    '数据看板',
    '找出看板中卡片网格的对齐问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="76" font-family="Arial" font-size="18" font-weight="700" fill="#172033">数据概览</text>
     <rect x="48" y="130" width="260" height="120" rx="14" fill="#fff"/><text x="72" y="165" font-family="Arial" font-size="13" fill="#64748b">用户</text><text x="72" y="210" font-family="Arial" font-size="24" font-weight="700" fill="#172033">12,480</text>
     <rect x="330" y="140" width="270" height="110" rx="14" fill="#fff"/><text x="354" y="175" font-family="Arial" font-size="13" fill="#64748b">订单</text><text x="354" y="220" font-family="Arial" font-size="24" font-weight="700" fill="#172033">3,920</text>
     <rect x="630" y="125" width="280" height="125" rx="14" fill="#fff"/><text x="654" y="160" font-family="Arial" font-size="13" fill="#64748b">营收</text><text x="654" y="205" font-family="Arial" font-size="24" font-weight="700" fill="#172033">¥86,200</text>
     <rect x="48" y="300" width="862" height="240" rx="14" fill="#fff"/>
     <text x="80" y="345" font-family="Arial" font-size="15" font-weight="700" fill="#172033">最近订单</text>
     <text x="80" y="390" font-family="Arial" font-size="13" fill="#64748b">编号</text><text x="250" y="395" font-family="Arial" font-size="13" fill="#64748b">客户</text><text x="500" y="388" font-family="Arial" font-size="13" fill="#64748b">金额</text><text x="720" y="392" font-family="Arial" font-size="13" fill="#64748b">状态</text>`,
    [
      { id: 'h1', x: 40, y: 125, width: 880, height: 130, issue: '三张指标卡顶部 y 坐标不一致，未沿网格对齐', principle: '对齐', explanation: '卡片顶部分别在 y=130、140、125，破坏了看板的严谨感。', suggestion: '所有卡片顶部对齐到同一 y 基线，宽高保持一致。' },
      { id: 'h2', x: 70, y: 375, width: 700, height: 30, issue: '表头列文字 y 基线不统一', principle: '对齐', explanation: '编号 y=390、客户 y=395、金额 y=388、状态 y=392，列文字高低不齐。', suggestion: '表头所有列文字对齐到同一 y 基线，形成整齐的行秩序。' },
    ],
  ),

  // 9. 文章详情页：标题与正文错位 + 引用块偏移
  buildQuestion(
    'spot-alignment-004',
    'alignment',
    '文章详情页',
    '找出文章页中正文与引用块的对齐问题',
    `<rect x="120" y="60" width="720" height="500" rx="0" fill="#f8fafc"/>
     <text x="140" y="120" font-family="Arial" font-size="28" font-weight="700" fill="#172033">设计原则的实践</text>
     <text x="160" y="155" font-family="Arial" font-size="13" fill="#64748b">作者 · 2024</text>
     <text x="140" y="200" font-family="Arial" font-size="15" fill="#475569">正文段落一：设计原则是审美训练的基础。</text>
     <text x="140" y="230" font-family="Arial" font-size="15" fill="#475569">正文段落二：通过练习可以提升判断力。</text>
     <rect x="100" y="270" width="760" height="80" rx="10" fill="#eef2ff"/><text x="130" y="315" font-family="Arial" font-size="14" fill="#475569">引用：好的设计是看不见的设计。</text>
     <text x="140" y="380" font-family="Arial" font-size="15" fill="#475569">正文段落三：继续探讨实践方法。</text>`,
    [
      { id: 'h1', x: 130, y: 105, width: 320, height: 60, issue: '标题与作者信息左基线不一致', principle: '对齐', explanation: '标题 x=140，作者 x=160，基线错位使头部显得松散。', suggestion: '标题与作者信息左对齐到同一基线。' },
      { id: 'h2', x: 90, y: 260, width: 780, height: 100, issue: '引用块左边界超出正文左边距', principle: '对齐', explanation: '引用块 x=100，正文 x=140，引用块左探破坏了正文阅读节奏。', suggestion: '引用块与正文左对齐到同一基线，通过样式（如左边框）区分而非位置错开。' },
    ],
  ),

  // 10. 设置页：行与开关错位
  buildQuestion(
    'spot-alignment-005',
    'alignment',
    '设置页',
    '找出设置页中选项行与开关的对齐问题',
    `<rect x="120" y="60" width="720" height="500" rx="16" fill="#fff"/>
     <text x="160" y="110" font-family="Arial" font-size="20" font-weight="700" fill="#172033">通知设置</text>
     <text x="160" y="170" font-family="Arial" font-size="14" font-weight="600" fill="#172033">邮件通知</text><text x="160" y="195" font-family="Arial" font-size="12" fill="#64748b">接收产品更新邮件</text><rect x="700" y="160" width="44" height="26" rx="13" fill="#2563eb"/>
     <text x="150" y="250" font-family="Arial" font-size="14" font-weight="600" fill="#172033">推送通知</text><text x="150" y="275" font-family="Arial" font-size="12" fill="#64748b">接收实时推送</text><rect x="710" y="240" width="44" height="26" rx="13" fill="#cbd5e1"/>
     <text x="170" y="330" font-family="Arial" font-size="14" font-weight="600" fill="#172033">短信通知</text><text x="170" y="355" font-family="Arial" font-size="12" fill="#64748b">重要事件短信提醒</text><rect x="690" y="320" width="44" height="26" rx="13" fill="#cbd5e1"/>`,
    [
      { id: 'h1', x: 140, y: 150, width: 400, height: 210, issue: '邮件通知行标题左基线与其他行不一致', principle: '对齐', explanation: '邮件 x=160、推送 x=150、短信 x=170，三行标题左基线各不相同。', suggestion: '所有行标题左对齐到同一基线，形成整齐的行秩序。' },
      { id: 'h2', x: 680, y: 150, width: 80, height: 210, issue: '右侧开关的 x 位置各行不同', principle: '对齐', explanation: '开关分别在 x=700、710、690，未右对齐到同一垂直基线。', suggestion: '所有开关右对齐到同一垂直基线，保持行内秩序一致。' },
    ],
  ),

  /* ---------- 重复 repetition ---------- */

  // 11. 卡片列表：三张卡片圆角/尺寸/样式不一
  buildQuestion(
    'spot-repetition-001',
    'repetition',
    '功能卡片列表',
    '找出功能卡片样式不统一的重复问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="76" font-family="Arial" font-size="18" font-weight="700" fill="#172033">核心功能</text>
     <rect x="48" y="130" width="260" height="170" rx="4" fill="#fff" stroke="#f59e0b"/><circle cx="88" cy="170" r="14" fill="#fef3c7"/><text x="72" y="220" font-family="Arial" font-size="18" fill="#172033">功能一</text><text x="72" y="250" font-family="Arial" font-size="13" fill="#64748b">说明文字</text>
     <rect x="350" y="150" width="240" height="150" rx="28" fill="#f1f5f9"/><rect x="370" y="170" width="28" height="28" rx="6" fill="#cbd5e1"/><text x="374" y="225" font-family="Arial" font-size="22" font-weight="700" fill="#172033">功能二</text>
     <rect x="640" y="120" width="270" height="180" rx="0" fill="#eff6ff"/><text x="664" y="165" font-family="Arial" font-size="13" fill="#172033">功能三</text>`,
    [
      { id: 'h1', x: 40, y: 125, width: 280, height: 180, issue: '卡片一圆角过小且使用橙色描边，与其他卡片不一致', principle: '重复', explanation: '卡片一圆角 4px、橙色描边，与卡片二（28px 圆角）、卡片三（无圆角）样式各异。', suggestion: '所有卡片共用统一的圆角、描边和背景，形成一致的组件规范。' },
      { id: 'h2', x: 340, y: 145, width: 260, height: 165, issue: '卡片二圆角过大，图标样式与其他卡片不同', principle: '重复', explanation: '卡片二圆角 28px、使用方形图标，与卡片一（圆形图标）风格不统一。', suggestion: '统一圆角尺寸与图标风格，保持组件一致性。' },
      { id: 'h3', x: 635, y: 115, width: 280, height: 190, issue: '卡片三无圆角且缺少图标，结构与其他卡片不同', principle: '重复', explanation: '卡片三圆角 0、无图标、标题字号不同，破坏了列表的统一感。', suggestion: '卡片三补充图标、统一圆角与字号，与其他卡片保持一致结构。' },
    ],
  ),

  // 12. 商品列表：商品卡片结构不一
  buildQuestion(
    'spot-repetition-002',
    'repetition',
    '电商商品列表',
    '找出商品卡片结构不统一的重复问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="72" font-family="Arial" font-size="15" font-weight="700" fill="#172033">商品列表</text>
     <rect x="48" y="130" width="270" height="200" rx="12" fill="#fff"/><rect x="48" y="130" width="270" height="140" rx="12" fill="#e2e8f0"/><text x="72" y="295" font-family="Arial" font-size="15" font-weight="700" fill="#172033">商品 A</text><text x="72" y="318" font-family="Arial" font-size="14" font-weight="700" fill="#dc2626">¥128</text>
     <rect x="345" y="130" width="270" height="200" rx="12" fill="#fff"/><rect x="345" y="130" width="270" height="100" rx="8" fill="#f1f5f9"/><text x="369" y="260" font-family="Arial" font-size="18" fill="#475569">商品 B</text><text x="600" y="260" font-family="Arial" font-size="13" fill="#64748b" text-anchor="end">¥98</text>
     <rect x="642" y="130" width="270" height="200" rx="12" fill="#fff"/><rect x="642" y="130" width="270" height="160" rx="12" fill="#eff6ff"/><text x="666" y="310" font-family="Arial" font-size="14" font-weight="700" fill="#172033">商品 C</text>`,
    [
      { id: 'h1', x: 340, y: 125, width: 280, height: 210, issue: '商品 B 图片比例、圆角与标题字号与其他卡片不一致', principle: '重复', explanation: '商品 B 图片高度 100、圆角 8、标题字号 18，与卡片 A（140/12/15）不同。', suggestion: '所有商品卡片共用统一的图片比例、圆角和标题字号。' },
      { id: 'h2', x: 635, y: 125, width: 280, height: 210, issue: '商品 C 缺少价格，结构与其他卡片不同', principle: '重复', explanation: '商品 C 没有价格信息，卡片 A/B 都有价格，结构不统一影响横向对比。', suggestion: '所有商品卡片统一包含图片、标题、价格，保持一致结构。' },
    ],
  ),

  // 13. 数据看板：指标卡结构不一
  buildQuestion(
    'spot-repetition-003',
    'repetition',
    '数据看板',
    '找出指标卡结构不统一的重复问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="76" font-family="Arial" font-size="18" font-weight="700" fill="#172033">指标</text>
     <rect x="48" y="130" width="270" height="130" rx="14" fill="#fff"/><text x="72" y="165" font-family="Arial" font-size="13" fill="#64748b">用户</text><text x="72" y="210" font-family="Arial" font-size="24" font-weight="700" fill="#172033">12,480</text><text x="72" y="235" font-family="Arial" font-size="11" fill="#34c759">+3.2%</text>
     <rect x="345" y="130" width="270" height="130" rx="14" fill="#fff"/><text x="369" y="170" font-family="Arial" font-size="16" font-weight="700" fill="#172033">订单量</text><text x="369" y="210" font-family="Arial" font-size="24" font-weight="700" fill="#172033">3,920</text>
     <rect x="642" y="130" width="270" height="130" rx="14" fill="#fff"/><text x="666" y="165" font-family="Arial" font-size="13" fill="#64748b">营收</text><text x="666" y="200" font-family="Arial" font-size="20" fill="#475569">¥86,200</text><rect x="666" y="220" width="80" height="20" rx="4" fill="#fef3c7"/><text x="676" y="234" font-family="Arial" font-size="11" fill="#f59e0b">达标</text>`,
    [
      { id: 'h1', x: 340, y: 130, width: 280, height: 135, issue: '订单卡标题字号加粗且缺少趋势，与其他卡片结构不同', principle: '重复', explanation: '订单卡标题 16px 加粗无趋势，用户卡标题 13px 有趋势，结构不统一。', suggestion: '所有指标卡共用统一的标题字号、数字字号和趋势位排列规则。' },
      { id: 'h2', x: 635, y: 130, width: 280, height: 135, issue: '营收卡数字字号偏小且用标签替代趋势文字', principle: '重复', explanation: '营收卡数字 20px、使用黄色标签，与用户卡的 24px 数字+绿色趋势文字结构不同。', suggestion: '统一数字字号与趋势呈现方式，保持指标卡结构一致。' },
    ],
  ),

  // 14. 导航栏：导航项样式不一
  buildQuestion(
    'spot-repetition-004',
    'repetition',
    '导航栏',
    '找出导航项样式不统一的重复问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/>
     <circle cx="80" cy="68" r="10" fill="#2563eb"/><text x="100" y="73" font-family="Arial" font-size="15" font-weight="700" fill="#172033">Northstar</text>
     <text x="280" y="73" font-family="Arial" font-size="14" font-weight="700" fill="#2563eb">产品</text>
     <text x="360" y="73" font-family="Arial" font-size="13" fill="#64748b">方案</text>
     <rect x="430" y="55" width="50" height="28" rx="14" fill="#eff6ff"/><text x="455" y="74" font-family="Arial" font-size="13" fill="#2563eb" text-anchor="middle">资源</text>
     <text x="520" y="73" font-family="Arial" font-size="15" fill="#475569" text-decoration="underline">案例</text>
     <text x="780" y="73" font-family="Arial" font-size="13" fill="#64748b">登录</text>`,
    [
      { id: 'h1', x: 270, y: 55, width: 110, height: 30, issue: '产品项加粗品牌色，方案项常规灰色，样式不统一', principle: '重复', explanation: '导航项字号、字重、颜色各异，未共用统一的文字样式规范。', suggestion: '导航项共用统一的字号、字重和颜色，仅通过选中态区分。' },
      { id: 'h2', x: 420, y: 50, width: 70, height: 40, issue: '资源项使用胶囊背景，与其他文字态导航项不一致', principle: '重复', explanation: '资源项用填充背景，其他项为纯文字，样式不统一。', suggestion: '导航项统一为文字态，选中项通过颜色或下划线区分。' },
      { id: 'h3', x: 500, y: 55, width: 70, height: 30, issue: '案例项带下划线且字号不同', principle: '重复', explanation: '案例项 15px 带下划线，与其他项样式不一致。', suggestion: '案例项移除下划线，统一字号与样式。' },
    ],
  ),

  // 15. 设置行：行结构不一
  buildQuestion(
    'spot-repetition-005',
    'repetition',
    '设置页',
    '找出设置行结构不统一的重复问题',
    `<rect x="120" y="60" width="720" height="500" rx="16" fill="#fff"/>
     <text x="160" y="110" font-family="Arial" font-size="20" font-weight="700" fill="#172033">偏好设置</text>
     <text x="160" y="170" font-family="Arial" font-size="14" font-weight="600" fill="#172033">深色模式</text><text x="160" y="195" font-family="Arial" font-size="12" fill="#64748b">跟随系统</text><rect x="700" y="160" width="44" height="26" rx="13" fill="#2563eb"/>
     <text x="160" y="240" font-family="Arial" font-size="14" fill="#475569">语言</text><rect x="660" y="225" width="90" height="32" rx="8" fill="#f1f5f9"/><text x="705" y="246" font-family="Arial" font-size="13" fill="#475569" text-anchor="middle">简体中文</text>
     <text x="160" y="305" font-family="Arial" font-size="14" font-weight="600" fill="#172033">自动更新</text><rect x="690" y="290" width="44" height="26" rx="13" fill="#cbd5e1"/>
     <text x="160" y="370" font-family="Arial" font-size="14" fill="#475569">字体大小</text><text x="760" y="370" font-family="Arial" font-size="13" fill="#2563eb" text-anchor="end">中</text>`,
    [
      { id: 'h1', x: 150, y: 155, width: 600, height: 50, issue: '深色模式行有说明文字，其他行没有，结构不统一', principle: '重复', explanation: '深色模式行有标题+说明+开关，语言行只有标题+下拉，结构各异。', suggestion: '所有行共用统一的标题+说明+控件排列规则。' },
      { id: 'h2', x: 150, y: 225, width: 600, height: 45, issue: '语言行使用下拉选择，控件类型与其他行不一致', principle: '重复', explanation: '语言行用下拉框，深色/自动更新用开关，控件类型不统一（此处指结构不一致）。', suggestion: '同类设置项使用同类控件，保持行结构一致。' },
    ],
  ),

  /* ---------- 亲密性 proximity ---------- */

  // 16. 表单页：标签远离输入框 + 字段过近
  buildQuestion(
    'spot-proximity-001',
    'proximity',
    '表单页',
    '找出表单中标签与字段距离的亲密性问题',
    `<rect x="280" y="60" width="400" height="480" rx="20" fill="#fff"/>
     <text x="320" y="120" font-family="Arial" font-size="20" font-weight="700" fill="#172033">注册</text>
     <text x="320" y="170" font-family="Arial" font-size="13" fill="#64748b">姓名</text>
     <rect x="320" y="230" width="320" height="44" rx="8" fill="#f1f5f9"/>
     <text x="320" y="250" font-family="Arial" font-size="13" fill="#64748b">邮箱</text>
     <rect x="320" y="260" width="320" height="44" rx="8" fill="#f1f5f9"/>
     <text x="320" y="335" font-family="Arial" font-size="13" fill="#64748b">密码</text>
     <rect x="320" y="395" width="320" height="44" rx="8" fill="#f1f5f9"/>
     <rect x="320" y="460" width="320" height="46" rx="12" fill="#2563eb"/>`,
    [
      { id: 'h1', x: 310, y: 160, width: 340, height: 80, issue: '姓名标签与对应输入框距离过远', principle: '亲密性', explanation: '姓名标签 y=170，输入框 y=230，相距 60px，用户难以判断标签属于哪个字段。', suggestion: '标签紧贴输入框上方（间距 4-8px），与下一字段保持更大距离。' },
      { id: 'h2', x: 310, y: 240, width: 340, height: 30, issue: '邮箱标签与密码标签距离过近，字段归属混淆', principle: '亲密性', explanation: '邮箱标签 y=250，密码标签 y=335 之间夹着两个输入框，分组关系混乱。', suggestion: '每个字段的标签紧贴其输入框，字段之间保持明显间距以区分分组。' },
    ],
  ),

  // 17. 文章页：标题远离作者 + 正文紧贴头部
  buildQuestion(
    'spot-proximity-002',
    'proximity',
    '文章详情页',
    '找出文章页中标题与作者信息的亲密性问题',
    `<rect x="120" y="60" width="720" height="500" rx="0" fill="#f8fafc"/>
     <text x="140" y="110" font-family="Arial" font-size="28" font-weight="700" fill="#172033">设计原则的实践</text>
     <text x="140" y="200" font-family="Arial" font-size="15" fill="#475569">正文段落一：设计原则是审美训练的基础。</text>
     <text x="140" y="150" font-family="Arial" font-size="13" fill="#64748b">作者 · 2024</text>
     <text x="140" y="230" font-family="Arial" font-size="15" fill="#475569">正文段落二：通过练习可以提升判断力。</text>
     <text x="140" y="330" font-family="Arial" font-size="15" fill="#475569">正文段落三：继续探讨实践方法。</text>`,
    [
      { id: 'h1', x: 130, y: 95, width: 400, height: 70, issue: '标题与作者信息之间被正文段落插入，归属关系混乱', principle: '亲密性', explanation: '标题 y=110，作者 y=150，正文 y=200，但作者在标题下方又被正文紧贴，分组不清晰。', suggestion: '标题与作者信息紧密相邻成组，与正文保持明显距离。' },
      { id: 'h2', x: 130, y: 250, width: 500, height: 90, issue: '正文段落二与段落三之间距离过大，且与段落一距离不一致', principle: '亲密性', explanation: '段落一 y=200、二 y=230、三 y=330，段落间距不统一，阅读节奏被打乱。', suggestion: '同属正文的段落保持均匀间距，与其他模块保持明显距离。' },
    ],
  ),

  // 18. 数据看板：指标与趋势分散 + 卡片过近
  buildQuestion(
    'spot-proximity-003',
    'proximity',
    '数据看板',
    '找出看板中指标与趋势的亲密性问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="76" font-family="Arial" font-size="18" font-weight="700" fill="#172033">数据概览</text>
     <rect x="48" y="130" width="260" height="130" rx="14" fill="#fff"/><text x="72" y="165" font-family="Arial" font-size="13" fill="#64748b">用户</text><text x="72" y="220" font-family="Arial" font-size="24" font-weight="700" fill="#172033">12,480</text><text x="280" y="165" font-family="Arial" font-size="11" fill="#34c759">+3.2%</text>
     <rect x="310" y="130" width="260" height="130" rx="14" fill="#fff"/><text x="334" y="165" font-family="Arial" font-size="13" fill="#64748b">订单</text><text x="334" y="220" font-family="Arial" font-size="24" font-weight="700" fill="#172033">3,920</text><text x="540" y="165" font-family="Arial" font-size="11" fill="#ff3b30">-1.1%</text>
     <rect x="572" y="130" width="260" height="130" rx="14" fill="#fff"/><text x="596" y="165" font-family="Arial" font-size="13" fill="#64748b">营收</text><text x="596" y="220" font-family="Arial" font-size="24" font-weight="700" fill="#172033">¥86,200</text>`,
    [
      { id: 'h1', x: 60, y: 150, width: 230, height: 30, issue: '用户指标的趋势文字远离指标数字，归属不清', principle: '亲密性', explanation: '趋势文字在 x=280 右上角，与数字（x=72, y=220）距离过远，难以判断趋势属于哪个指标。', suggestion: '趋势文字紧贴指标数字相邻，与其他卡片保持距离。' },
      { id: 'h2', x: 300, y: 125, width: 20, height: 140, issue: '用户卡与订单卡之间间距过小，分组不清晰', principle: '亲密性', explanation: '卡片一 x=48 宽 260，卡片二 x=310，间距仅 2px，两张卡片几乎贴合。', suggestion: '卡片之间保持明显间距（如 24px），每张卡片自成一组。' },
    ],
  ),

  // 19. 消息列表：头像远离文字 + 条目过近
  buildQuestion(
    'spot-proximity-004',
    'proximity',
    '消息中心',
    '找出消息列表中头像与文字的亲密性问题',
    `<rect x="48" y="40" width="864" height="56" rx="12" fill="#fff"/><text x="80" y="76" font-family="Arial" font-size="18" font-weight="700" fill="#172033">消息中心</text>
     <rect x="48" y="130" width="864" height="80" rx="12" fill="#fff"/>
     <circle cx="80" cy="170" r="18" fill="#cbd5e1"/>
     <text x="200" y="165" font-family="Arial" font-size="14" font-weight="700" fill="#172033">系统通知</text>
     <text x="200" y="190" font-family="Arial" font-size="12" fill="#64748b">您的账号已验证成功</text>
     <text x="860" y="165" font-family="Arial" font-size="11" fill="#94a3b8" text-anchor="end">10:30</text>
     <rect x="48" y="212" width="864" height="80" rx="12" fill="#fff"/>
     <circle cx="80" cy="252" r="18" fill="#cbd5e1"/>
     <text x="200" y="247" font-family="Arial" font-size="14" font-weight="700" fill="#172033">订单更新</text>
     <text x="200" y="272" font-family="Arial" font-size="12" fill="#64748b">您的订单已发货</text>`,
    [
      { id: 'h1', x: 60, y: 145, width: 200, height: 55, issue: '头像与消息标题距离过远，归属关系不清', principle: '亲密性', explanation: '头像 x=80，标题 x=200，相距 120px，用户难以判断头像属于哪条消息。', suggestion: '头像紧贴消息标题相邻（间距 8-12px），与其他消息保持距离。' },
      { id: 'h2', x: 40, y: 205, width: 870, height: 20, issue: '两条消息之间间距过小，分组不清晰', principle: '亲密性', explanation: '消息一 y=130-210，消息二 y=212，间距仅 2px，两条消息几乎贴合。', suggestion: '消息之间保持明显间距（如 12-16px），每条消息自成一组。' },
    ],
  ),

  // 20. 个人资料页：字段名与值分散 + 区块过近
  buildQuestion(
    'spot-proximity-005',
    'proximity',
    '个人资料页',
    '找出资料页中字段名与值的亲密性问题',
    `<rect x="120" y="60" width="720" height="500" rx="16" fill="#fff"/>
     <text x="160" y="110" font-family="Arial" font-size="20" font-weight="700" fill="#172033">个人资料</text>
     <text x="160" y="160" font-family="Arial" font-size="13" fill="#64748b">姓名</text>
     <text x="500" y="160" font-family="Arial" font-size="14" fill="#172033">张明</text>
     <text x="160" y="175" font-family="Arial" font-size="13" fill="#64748b">职位</text>
     <text x="500" y="175" font-family="Arial" font-size="14" fill="#172033">产品经理</text>
     <text x="160" y="230" font-family="Arial" font-size="15" font-weight="700" fill="#172033">联系方式</text>
     <text x="160" y="245" font-family="Arial" font-size="13" fill="#64748b">邮箱</text>
     <text x="500" y="245" font-family="Arial" font-size="14" fill="#172033">zhang@example.com</text>`,
    [
      { id: 'h1', x: 150, y: 145, width: 400, height: 18, issue: '字段名与字段值左右分布距离过远，归属不清', principle: '亲密性', explanation: '姓名标签 x=160，值 x=500，相距 340px，用户难以判断值属于哪个字段。', suggestion: '字段名与值紧密相邻（如值紧跟标签右侧），与其他字段保持距离。' },
      { id: 'h2', x: 150, y: 166, width: 400, height: 24, issue: '姓名行与职位行距离过近，字段分组混淆', principle: '亲密性', explanation: '姓名 y=160，职位 y=175，间距仅 15px，两行几乎贴合。', suggestion: '每个字段行之间保持明显间距（如 24px），每个字段自成一组。' },
    ],
  ),
];

export const spotQuestions = QUESTIONS_RAW;

export function getSpotQuestionById(id) {
  if (!id || typeof id !== 'string') return null;
  return spotQuestions.find((q) => q.id === id) || null;
}

export function getSpotQuestionsByDimension(dimension) {
  if (!dimension || typeof dimension !== 'string') return [];
  return spotQuestions.filter((q) => q.dimension === dimension);
}

/**
 * 校验找茬题库完整性
 * @returns {Array<string>} 问题列表，空数组表示通过
 */
export function validateSpotQuestions() {
  const issues = [];
  const ids = new Set();

  if (spotQuestions.length < 20) {
    issues.push(`题目总数应至少 20，实际为 ${spotQuestions.length}`);
  }

  for (const dimension of Object.keys(SPOT_DIMENSIONS)) {
    const count = spotQuestions.filter((q) => q.dimension === dimension).length;
    if (count < 5) {
      issues.push(`${dimension} 题目数量应至少 5，实际为 ${count}`);
    }
  }

  for (const q of spotQuestions) {
    if (ids.has(q.id)) issues.push(`题目 ID 重复: ${q.id}`);
    ids.add(q.id);

    if (!q.scenario) issues.push(`题目缺少场景: ${q.id}`);
    if (!q.image || !q.image.startsWith('data:image/svg+xml')) {
      issues.push(`题目图片非合法 SVG data URL: ${q.id}`);
    }
    if (!Array.isArray(q.hotspots) || q.hotspots.length < 2) {
      issues.push(`题目热点应至少 2 个: ${q.id}`);
      continue;
    }

    // 热点坐标必须落在画布范围内
    for (const h of q.hotspots) {
      if (h.x < 0 || h.y < 0 || h.x + h.width > CANVAS_WIDTH || h.y + h.height > CANVAS_HEIGHT) {
        issues.push(`热点越界: ${q.id} / ${h.id}`);
      }
      if (!h.issue || !h.principle || !h.explanation || !h.suggestion) {
        issues.push(`热点信息不完整: ${q.id} / ${h.id}`);
      }
    }

    // 热点之间不能全部重叠
    if (q.hotspots.length >= 2) {
      let allOverlap = true;
      for (let i = 0; i < q.hotspots.length; i += 1) {
        for (let j = i + 1; j < q.hotspots.length; j += 1) {
          const a = q.hotspots[i];
          const b = q.hotspots[j];
          const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
          const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
          if (!overlapX || !overlapY) {
            allOverlap = false;
            break;
          }
        }
        if (!allOverlap) break;
      }
      if (allOverlap) issues.push(`热点全部重叠: ${q.id}`);
    }
  }

  return issues;
}
