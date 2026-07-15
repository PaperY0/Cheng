# 澄境参赛报名页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成可发布的学习工作赛道报名帖与可独立打开、可上传社区的澄境 HTML 创意展示文件。

**Architecture:** 报名帖作为 Markdown 文案存放在项目根目录，HTML 使用内嵌 CSS 与原生 JavaScript 构成独立展示页。页面只使用蓝色 Apple Glass 视觉令牌与 CSS 微动效，不依赖 Vite、接口、图片资源或第三方框架。

**Tech Stack:** HTML5、CSS3、原生 JavaScript。

## Global Constraints

- 标签固定为学习工作，正文包含四项赛事要求且不少于 100 字。
- 项目名称固定为澄境。
- HTML 为单文件，可双击打开。
- 主色保持蓝色与青蓝色，不使用黑色主题。
- 卡片使用半透明白色、背景模糊、浅色边框、蓝色柔和阴影。
- 支持窄屏布局和 prefers-reduced-motion。

---

### Task 1: 编写报名帖

**Files:**
- Create: `澄境_报名帖子.md`

- [ ] **Step 1: 写入标签、标题和 4 个规定正文部分。**
- [ ] **Step 2: 检查正文含创意介绍、目标用户及痛点、价值与意义、TRAE Work HTML 附件说明，字数超过 100。**

### Task 2: 生成独立 HTML 展示页

**Files:**
- Create: `澄境_TRAEWork_创意展示.html`

- [ ] **Step 1: 构建 Hero、痛点、产品闭环、四项能力和价值模块。**
- [ ] **Step 2: 内嵌蓝色 Apple Glass CSS、响应式断点和减少动画规则。**
- [ ] **Step 3: 使用原生 JavaScript 为流程步骤和能力卡片提供轻量交互。**
- [ ] **Step 4: 在浏览器静态打开并检查无外部资源依赖、无横向溢出。**
