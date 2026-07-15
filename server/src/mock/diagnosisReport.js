// Mock 诊断报告生成器（确定性内容，仅用于验证产品流程，不接入真实 AI）

// 生成唯一 reportId
function generateReportId() {
  const ts = Date.now().toString(36);
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `mock-report-${ts}-${crypto.randomUUID()}`;
  }
  const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `mock-report-${ts}-${rand}`;
}

// 生成 Mock 结构化报告
export function generateMockReport() {
  return {
    reportId: generateReportId(),
    summary: {
      oneLineConclusion: '页面信息完整，但当前存在多个视觉焦点。',
      overallState: '结构基本清晰，但视觉焦点分散',
      confidence: 0.82,
      confidenceNote: '这是 Mock 诊断结果，仅用于验证产品流程。',
    },
    scores: {
      layout: 6,
      color: 7,
      typography: 6,
      whitespace: 5,
    },
    priorities: ['issue-1', 'issue-2', 'issue-3'],
    issues: [
      {
        id: 'issue-1',
        title: '页面顶部存在多个接近的视觉焦点',
        dimension: 'layout',
        location: '页面顶部标题与首屏内容区域',
        severity: 'high',
        observation: '主标题、数据模块和操作按钮的视觉权重较接近。',
        reason: '用户难以快速判断页面首先应该关注的内容。',
        suggestion: '保留主标题作为唯一一级视觉焦点，降低次级模块的强调程度。',
        prompt: '请保留当前页面的主要内容，将主标题设为唯一一级视觉焦点，降低次级模块的视觉权重，不新增装饰元素。',
        principle: '对比',
      },
      {
        id: 'issue-2',
        title: '模块之间的垂直间距不够统一',
        dimension: 'whitespace',
        location: '首屏模块之间',
        severity: 'medium',
        observation: '多个模块之间的间距节奏不一致。',
        reason: '页面阅读节奏容易被打断。',
        suggestion: '统一主要模块的垂直间距，并增加标题与内容区之间的留白。',
        prompt: '请统一主要模块之间的垂直间距，并增加页面标题与内容区之间的留白，不改变核心文案。',
        principle: '亲密性',
      },
      {
        id: 'issue-3',
        title: '部分文本层级差异不明显',
        dimension: 'typography',
        location: '标题、说明文字和按钮文案',
        severity: 'medium',
        observation: '标题与说明文字的字号或字重差异较小。',
        reason: '用户不容易区分主要信息和辅助信息。',
        suggestion: '扩大标题与正文的字号、字重或颜色差异。',
        prompt: '请扩大标题、正文和辅助说明之间的字号与字重差异，保留现有字体风格和核心文案。',
        principle: '对比',
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}
