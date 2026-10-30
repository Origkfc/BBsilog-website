// Reveal each section once when it first enters the viewport.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      entry.target.animate([
        { opacity: 0, transform: 'translateY(22px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)', iterations: 1 });
    }
  }, { threshold: 0, rootMargin: '0px 0px -35px 0px' });
  document.querySelectorAll('main > section').forEach(section => {
    observer.observe(section.querySelector(':scope > .wrap') || section);
  });
})();
