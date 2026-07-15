// Shared reveal behavior for initial renders and dynamically inserted content.
export function revealElements(root, IntersectionObserverCtor = globalThis.IntersectionObserver) {
  const scope = root || globalThis.document;
  if (!scope || typeof scope.querySelectorAll !== 'function') return;

  const elements = Array.from(scope.querySelectorAll('[data-reveal], [data-reveal-stagger]'));
  if (!elements.length) return;

  const revealAll = () => elements.forEach((element) => element.classList.add('revealed'));

  if (typeof IntersectionObserverCtor !== 'function') {
    revealAll();
    return;
  }

  try {
    let observer;
    observer = new IntersectionObserverCtor((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    elements.forEach((element) => observer.observe(element));
  } catch (_) {
    revealAll();
  }
}
