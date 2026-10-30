// Place each sung line in free hero space, clear of the logo and foreground.
(() => {
  let last = null;

  function place(cue) {
    const hero = document.getElementById('home');
    if (!hero || !cue.textContent.trim()) return;
    const bounds = hero.getBoundingClientRect();
    const mobile = innerWidth < 700;
    const padding = mobile ? 14 : 26;
    const protectedRects = [...hero.querySelectorAll('.hero-grid > div:first-child > .pill, .hero-brand-mark, .hero-grid h1, .hero-grid > div:first-child > p, .hero-grid .actions, .hero-grid .small')]
      .map(el => el.getBoundingClientRect()).filter(r => r.width && r.height);
    const widths = mobile ? [156, Math.min(280, bounds.width-48)] : [225];
    let candidates = [];
    cue.style.left = '16px'; cue.style.top = '16px';
    cue.style.visibility = 'hidden';
    for (const width of widths) {
      cue.style.width = width + 'px';
      const height = cue.offsetHeight;
      const maxX = bounds.width - width - padding;
      const maxY = bounds.height - height - padding;
      for (let y = padding; y <= maxY; y += 16) {
        for (let x = padding; x <= maxX; x += 20) {
          const rect = {left: bounds.left+x-padding/2, right: bounds.left+x+width+padding/2, top: bounds.top+y-padding/2, bottom: bounds.top+y+height+padding/2};
          if (protectedRects.some(r => rect.left < r.right+padding && rect.right > r.left-padding && rect.top < r.bottom+padding && rect.bottom > r.top-padding)) continue;
          candidates.push({x,y});
        }
      }
      if(candidates.length) break;
    }
    if (!candidates.length) return; // Omit the line when a narrow screen has no safe space.
    const distant = last ? candidates.filter(p => Math.hypot(p.x-last.x,p.y-last.y) > Math.min(200,bounds.width*.3)) : candidates;
    const pool = distant.length ? distant : candidates;
    const chosen = pool[Math.floor(Math.random()*pool.length)];
    last = chosen;
    cue.style.left = chosen.x + 'px'; cue.style.top = chosen.y + 'px';
    cue.style.visibility = '';
  }
  window.positionBBSILOGLyric = place;
  let frame;
  addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { const cue=document.querySelector('#home>.hero-lyric'); if(cue)place(cue); });
  });
})();
