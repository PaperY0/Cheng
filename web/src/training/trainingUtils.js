// 审美训练 - 辅助工具函数
// 纯函数，无副作用，不依赖任何外部状态

/**
 * Fisher-Yates 洗牌算法，打乱题目顺序
 * 不修改原数组，返回新数组
 * @param {Array} list - 待打乱的数组
 * @returns {Array} 打乱后的新数组，输入非法时返回空数组
 */
export function shuffleQuestions(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  // 浅拷贝，避免修改原数组
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 计算得分百分比
 * @param {number} correctCount - 答对题数
 * @param {number} totalCount - 总题数
 * @returns {number} 百分比 0-100，四舍五入到整数；输入非法返回 0
 */
export function calculateScore(correctCount, totalCount) {
  const correct = Number(correctCount);
  const total = Number(totalCount);
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return 0;
  const safeCorrect = Math.max(0, Math.min(correct, total));
  return Math.round((safeCorrect / total) * 100);
}

/**
 * 获取准确率（小数形式）
 * @param {number} correctCount - 答对题数
 * @param {number} totalCount - 总题数
 * @returns {number} 0-1 之间的小数，输入非法返回 0
 */
export function getAccuracy(correctCount, totalCount) {
  const correct = Number(correctCount);
  const total = Number(totalCount);
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return 0;
  const safeCorrect = Math.max(0, Math.min(correct, total));
  return safeCorrect / total;
}

/**
 * 判断答题是否正确
 * @param {string} questionAnswer - 题目的正确答案
 * @param {string} userAnswer - 用户选择的答案
 * @returns {boolean}
 */
export function isAnswerCorrect(questionAnswer, userAnswer) {
  return questionAnswer === userAnswer;
}

/**
 * 格式化时长为可读字符串
 * @param {number} seconds - 秒数
 * @returns {string} 如 "2分30秒" 或 "45秒"
 */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest === 0 ? `${m}分钟` : `${m}分${rest}秒`;
}

/**
 * 根据准确率给出评级
 * @param {number} accuracy - 0-1 之间的小数
 * @returns {Object} { level, label, color }
 */
export function getRating(accuracy) {
  const pct = Math.max(0, Math.min(1, Number(accuracy) || 0));
  if (pct >= 0.9) return { level: 'S', label: '审美大师', color: '#af52de' };
  if (pct >= 0.75) return { level: 'A', label: '审美优秀', color: '#34c759' };
  if (pct >= 0.6) return { level: 'B', label: '审美良好', color: '#007aff' };
  if (pct >= 0.4) return { level: 'C', label: '继续努力', color: '#ff9500' };
  return { level: 'D', label: '需要加油', color: '#ff3b30' };
}
