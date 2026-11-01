(() => {
  const panel = document.createElement('aside');
  panel.className = 'connection-notice';
  panel.hidden = true;
  panel.setAttribute('role', 'status');
  panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = '<div class="connection-heading"><span class="connection-symbol" aria-hidden="true">!</span><strong></strong></div><p></p><button type="button">Retry & reload</button>';
  document.body.append(panel);
  const title = panel.querySelector('strong'), message = panel.querySelector('p'), retry = panel.querySelector('button');
  const connection = navigator.connection;
  let checking = null;
  const weak = () => connection && (['slow-2g','2g'].includes(connection.effectiveType) || (connection.downlink > 0 && connection.downlink < .6));
  function show(state) {
    if (panel.dataset.state === state) return;
    panel.dataset.state = state;
    panel.hidden = state === 'online';
    const content = {
      offline: ['No internet connection', 'You are offline. Reconnect to the internet, then tap Retry.'],
      weak: ['Your connection seems slow', 'Some photos or actions may take longer to load. Check your connection or tap Retry.'],
      unreachable: ['Unable to connect to BBSILOG', 'We could not reach the website. Check your connection, then tap Retry.']
    }[state];
    if (content) { title.textContent = content[0]; message.textContent = content[1]; }
  }
  function check() {
    if (!navigator.onLine) { show('offline'); return Promise.resolve(false); }
    if (checking) return checking;
    checking = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const started = performance.now();
      try {
        const response = await fetch('/files/connection-check.txt', {cache: 'no-store', signal: controller.signal});
        if (!response.ok || (await response.text()).trim() !== 'bbsilog-connection-ok') throw new Error('Unreachable');
        if (!navigator.onLine) { show('offline'); return false; }
        show(weak() || performance.now() - started > 4000 ? 'weak' : 'online');
        return true;
      } catch {
        show(navigator.onLine ? 'unreachable' : 'offline');
        return false;
      } finally { clearTimeout(timeout); checking = null; }
    })();
    return checking;
  }
  retry.addEventListener('click', async () => {
    retry.disabled = true;
    retry.textContent = 'Checking connection…';
    if (await check()) { location.reload(); return; }
    retry.disabled = false;
    retry.textContent = 'Retry & reload';
  });
  addEventListener('offline', () => show('offline'));
  addEventListener('online', check);
  connection?.addEventListener('change', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(() => { if (!document.hidden) check(); }, 60000);
  check();
})();
