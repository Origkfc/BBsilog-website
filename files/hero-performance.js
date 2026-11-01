/* Run the hero's visual work only while a visitor can see it. Music is independent. */
(() => {
  const hero = document.getElementById('home');
  if (!hero) return;
  let visible = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function update() {
    const active = visible && !document.hidden && !document.querySelector('.overlay.open');
    if (window.bbsilogHeroActive === active) return;
    window.bbsilogHeroActive = active;
    document.body.classList.toggle('hero-visuals-idle', !active);
    if (active) {
      startDVD();
      if (typeof beatAnalyser !== 'undefined' && beatAnalyser && !document.getElementById('bgMusic').paused) startBeatAnimation();
    } else {
      cancelAnimationFrame(dvdFrame);
      dvdFrame = 0;
      dvdPrevious = 0;
      resetBeatAnimation();
    }
    for (const video of hero.querySelectorAll('video.hero-clip')) {
      if (active && !reduced.matches) video.play().catch(() => {});
      else video.pause();
    }
    document.dispatchEvent(new Event('bbsilog:hero-activity'));
  }
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(hero);
  const overlayObserver = new MutationObserver(update);
  for (const overlay of document.querySelectorAll('.overlay')) overlayObserver.observe(overlay, {attributes: true, attributeFilter: ['class']});
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', () => { window.bbsilogHeroActive = undefined; update(); });
  update();
})();
