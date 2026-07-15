// 原生 JS CountUp：等价实现 React CountUp 的视口触发、延迟、缓动和千分位格式化。
export function mountCountUps(root = document) {
  const elements = [...root.querySelectorAll('[data-count-up]')];
  if (!elements.length) return () => {};

  const timers = new Map();
  const animate = (element) => {
    if (element.dataset.countStarted === 'true') return;
    element.dataset.countStarted = 'true';
    const to = Number(element.dataset.countTo || 0);
    const from = Number(element.dataset.countFrom || 0);
    const duration = Math.max(0.2, Number(element.dataset.countDuration || 1)) * 1000;
    const delay = Math.max(0, Number(element.dataset.countDelay || 0)) * 1000;
    const separator = element.dataset.countSeparator || '';
    const suffix = element.dataset.countSuffix || '';
    const decimals = Math.max(decimalPlaces(from), decimalPlaces(to));
    const format = (value) => {
      const formatted = new Intl.NumberFormat('en-US', {
        useGrouping: Boolean(separator), minimumFractionDigits: decimals, maximumFractionDigits: decimals,
      }).format(value);
      return `${separator ? formatted.replace(/,/g, separator) : formatted}${suffix}`;
    };
    element.textContent = format(from);
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const frame = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = format(from + (to - from) * eased);
        if (progress < 1) element.dataset.countFrame = String(requestAnimationFrame(frame));
      };
      element.dataset.countFrame = String(requestAnimationFrame(frame));
    }, delay);
    timers.set(element, timer);
  };

  let observer;
  if (typeof IntersectionObserver === 'undefined') {
    elements.forEach(animate);
  } else {
    observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { animate(entry.target); observer.unobserve(entry.target); }
    }), { once: true, margin: '0px' });
    elements.forEach((element) => observer.observe(element));
  }
  return () => {
    observer?.disconnect();
    elements.forEach((element) => {
      const timer = timers.get(element);
      if (timer) clearTimeout(timer);
      if (element.dataset.countFrame) cancelAnimationFrame(Number(element.dataset.countFrame));
    });
  };
}

function decimalPlaces(value) {
  const text = String(value);
  return text.includes('.') ? text.split('.')[1].length : 0;
}
