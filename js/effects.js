export default function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    els.forEach(el => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  els.forEach(el => io.observe(el));
}
